import { and, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { children } from "#/db/schema";
import { getChild } from "./family";

// An optional 4-digit PIN per Child, so siblings can't play each other's Quests on a shared device.
// Hashed with Web Crypto: cheap on the Worker's CPU, and the pause after wrong tries stops guessing.

export class PinError extends Error {}

export const MAX_TRIES = 5;
export const PAUSE_MS = 60_000;
// How long a correct PIN keeps the Child's Quests open on this device.
export const UNLOCK_MS = 4 * 60 * 60 * 1000;

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hashPin(salt: string, pin: string) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`)));
}

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

// Set, reset (a new PIN) or remove (null) a Child's PIN. Parents only.
export async function setPin(db: Db, familyId: string, childId: string, pin: string | null) {
  if (pin !== null && !/^\d{4}$/.test(pin)) throw new PinError("A PIN is four digits");
  await getChild(db, familyId, childId);
  const salt = crypto.randomUUID();
  await db
    .update(children)
    .set({
      pinHash: pin === null ? null : `${salt}:${await hashPin(salt, pin)}`,
      pinFailures: 0,
      pinPausedUntil: null,
    })
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)));
}

export async function unlockToken(secret: string, familyId: string, childId: string, now = new Date()) {
  const expires = now.getTime() + UNLOCK_MS;
  return `${childId}.${expires}.${await hmac(secret, `${familyId}:${childId}:${expires}`)}`;
}

export type PinResult = { ok: true; token: string } | { ok: false; pausedUntil: Date | null };

export async function enterPin(
  db: Db,
  input: { familyId: string; childId: string; pin: string; secret: string; now?: Date },
): Promise<PinResult> {
  const { familyId, childId } = input;
  const now = input.now ?? new Date();
  const child = await getChild(db, familyId, childId);
  const where = and(eq(children.id, childId), eq(children.familyId, familyId));
  if (!child.pinHash) return { ok: true, token: await unlockToken(input.secret, familyId, childId, now) };
  if (child.pinPausedUntil && child.pinPausedUntil > now)
    return { ok: false, pausedUntil: child.pinPausedUntil };
  const [salt, hash] = child.pinHash.split(":");
  if ((await hashPin(salt!, input.pin)) === hash) {
    await db.update(children).set({ pinFailures: 0, pinPausedUntil: null }).where(where);
    return { ok: true, token: await unlockToken(input.secret, familyId, childId, now) };
  }
  const failures = child.pinFailures + 1;
  const pausedUntil = failures >= MAX_TRIES ? new Date(now.getTime() + PAUSE_MS) : null;
  await db
    .update(children)
    .set({ pinFailures: pausedUntil ? 0 : failures, pinPausedUntil: pausedUntil })
    .where(where);
  return { ok: false, pausedUntil };
}

// Whether this device may open the Child's Quests: always without a PIN, else with a live unlock.
export async function childUnlocked(
  db: Db,
  input: { familyId: string; childId: string; secret: string; token: string | undefined; now?: Date },
): Promise<boolean> {
  const child = await getChild(db, input.familyId, input.childId);
  if (!child.pinHash) return true;
  const [childId, expires, signature] = (input.token ?? "").split(".");
  if (childId !== input.childId || !expires || Number(expires) < (input.now ?? new Date()).getTime()) {
    return false;
  }
  return signature === (await hmac(input.secret, `${input.familyId}:${childId}:${expires}`));
}
