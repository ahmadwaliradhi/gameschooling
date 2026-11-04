import { eq } from "drizzle-orm";
import type { Db } from "#/db";
import { families } from "#/db/schema";
import { checkPinShape, hmac, type PinResult, storedPin, tryPin } from "./pin";

// An optional 4-digit Parent PIN per Family, so Children can't open Parent screens on a shared device.
// One PIN for every Parent in the Family. Same hashing and pause after wrong tries as the Child PIN.

// How long a correct Parent PIN keeps Parent screens open on this device.
export const PARENT_UNLOCK_MS = 30 * 60 * 1000;
// A Parent who signed in with Google this recently is let in without the PIN (how a forgotten PIN is reset).
export const FRESH_SIGN_IN_MS = 5 * 60 * 1000;

async function getFamily(db: Db, familyId: string) {
  const family = await db.query.families.findFirst({ where: (f, { eq }) => eq(f.id, familyId) });
  if (!family) throw new Error("Family not found");
  return family;
}

export const hasParentPin = async (db: Db, familyId: string) =>
  (await getFamily(db, familyId)).parentPinHash !== null;

// Set, change (a new PIN) or remove (null) the Family's Parent PIN.
export async function setParentPin(db: Db, familyId: string, pin: string | null) {
  checkPinShape(pin);
  await getFamily(db, familyId);
  await db
    .update(families)
    .set({ parentPinHash: await storedPin(pin), parentPinFailures: 0, parentPinPausedUntil: null })
    .where(eq(families.id, familyId));
}

export async function parentUnlockToken(secret: string, familyId: string, now = new Date()) {
  const expires = now.getTime() + PARENT_UNLOCK_MS;
  return `parent.${expires}.${await hmac(secret, `parent:${familyId}:${expires}`)}`;
}

export async function enterParentPin(
  db: Db,
  input: { familyId: string; pin: string; secret: string; now?: Date },
): Promise<PinResult> {
  const now = input.now ?? new Date();
  const family = await getFamily(db, input.familyId);
  if (!family.parentPinHash)
    return { ok: true, token: await parentUnlockToken(input.secret, family.id, now) };
  const tried = await tryPin(
    {
      hash: family.parentPinHash,
      failures: family.parentPinFailures,
      pausedUntil: family.parentPinPausedUntil,
    },
    input.pin,
    now,
  );
  await db
    .update(families)
    .set({ parentPinFailures: tried.failures, parentPinPausedUntil: tried.pausedUntil })
    .where(eq(families.id, family.id));
  if (tried.ok) return { ok: true, token: await parentUnlockToken(input.secret, family.id, now) };
  return { ok: false, pausedUntil: tried.pausedUntil };
}

// Whether this device may open Parent screens: always without a Parent PIN, else with a live unlock
// or a Google sign-in from the last few minutes.
export async function parentUnlocked(
  db: Db,
  input: { familyId: string; secret: string; token: string | undefined; signedInAt?: Date; now?: Date },
): Promise<boolean> {
  const family = await getFamily(db, input.familyId);
  if (!family.parentPinHash) return true;
  const now = (input.now ?? new Date()).getTime();
  if (input.signedInAt && now - input.signedInAt.getTime() < FRESH_SIGN_IN_MS) return true;
  const [kind, expires, signature] = (input.token ?? "").split(".");
  if (kind !== "parent" || !expires || Number(expires) < now) return false;
  return signature === (await hmac(input.secret, `parent:${input.familyId}:${expires}`));
}
