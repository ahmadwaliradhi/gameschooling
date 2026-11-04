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

// Shared by the Child PIN and the Parent PIN.
export function checkPinShape(pin: string | null) {
  if (pin !== null && !/^\d{4}$/.test(pin)) throw new PinError("A PIN is four digits");
}

// The stored form of a PIN, or null to remove it.
export async function storedPin(pin: string | null) {
  checkPinShape(pin);
  if (pin === null) return null;
  const salt = crypto.randomUUID();
  return `${salt}:${await hashPin(salt, pin)}`;
}

export type PinState = { hash: string; failures: number; pausedUntil: Date | null };

// One try at a PIN: whether it matches, and the failures and pause to store afterwards.
export async function tryPin(state: PinState, pin: string, now: Date) {
  if (state.pausedUntil && state.pausedUntil > now) {
    return { ok: false as const, failures: state.failures, pausedUntil: state.pausedUntil };
  }
  const [salt, hash] = state.hash.split(":");
  if ((await hashPin(salt!, pin)) === hash) return { ok: true as const, failures: 0, pausedUntil: null };
  const failures = state.failures + 1;
  const pausedUntil = failures >= MAX_TRIES ? new Date(now.getTime() + PAUSE_MS) : null;
  return { ok: false as const, failures: pausedUntil ? 0 : failures, pausedUntil };
}

export async function hmac(secret: string, message: string) {
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
  checkPinShape(pin);
  await getChild(db, familyId, childId);
  await db
    .update(children)
    .set({
      pinHash: await storedPin(pin),
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
  const tried = await tryPin(
    { hash: child.pinHash, failures: child.pinFailures, pausedUntil: child.pinPausedUntil },
    input.pin,
    now,
  );
  await db
    .update(children)
    .set({ pinFailures: tried.failures, pinPausedUntil: tried.pausedUntil })
    .where(where);
  if (tried.ok) return { ok: true, token: await unlockToken(input.secret, familyId, childId, now) };
  return { ok: false, pausedUntil: tried.pausedUntil };
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
