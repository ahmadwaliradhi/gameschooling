import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { enterPin, unlockToken } from "./pin";
import {
  enterParentPin,
  hasParentPin,
  parentUnlocked,
  parentUnlockToken,
  PARENT_UNLOCK_MS,
  setParentPin,
} from "./parent-pin";
import { PinError } from "./pin";

const SECRET = "test-secret";

async function withParentPin(pin = "7316") {
  const db = await testDb();
  const family = await familyWithChild(db);
  await setParentPin(db, family.familyId, pin);
  return { db, ...family };
}

describe("Parent PIN", () => {
  it("leaves Parent screens open when the Family has no Parent PIN", async () => {
    const db = await testDb();
    const { familyId } = await familyWithChild(db);

    expect(await hasParentPin(db, familyId)).toBe(false);
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token: undefined })).toBe(true);
  });

  it("keeps Parent screens shut until the right Parent PIN is entered", async () => {
    const { db, familyId } = await withParentPin();
    expect(await hasParentPin(db, familyId)).toBe(true);
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token: undefined })).toBe(false);

    expect((await enterParentPin(db, { familyId, pin: "1111", secret: SECRET })).ok).toBe(false);
    const right = await enterParentPin(db, { familyId, pin: "7316", secret: SECRET });
    expect(right.ok).toBe(true);
    const token = right.ok ? right.token : undefined;
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token })).toBe(true);
  });

  it("shuts Parent screens again once the unlock runs out", async () => {
    const { db, familyId } = await withParentPin();
    const now = new Date();
    const right = await enterParentPin(db, { familyId, pin: "7316", secret: SECRET, now });
    const token = right.ok ? right.token : undefined;

    const later = new Date(now.getTime() + PARENT_UNLOCK_MS + 1);
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token, now: later })).toBe(false);
  });

  it("does not open Parent screens with a Child's unlock", async () => {
    const { db, familyId, childId } = await withParentPin();
    const childToken = await unlockToken(SECRET, familyId, childId);
    const childEntry = await enterPin(db, { familyId, childId, pin: "", secret: SECRET });
    const fromPad = childEntry.ok ? childEntry.token : undefined;

    expect(await parentUnlocked(db, { familyId, secret: SECRET, token: childToken })).toBe(false);
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token: fromPad })).toBe(false);
  });

  it("does not open another Family's Parent screens", async () => {
    const { db, familyId } = await withParentPin();
    const other = await familyWithChild(db);
    await setParentPin(db, other.familyId, "7316");
    const token = await parentUnlockToken(SECRET, familyId);

    expect(await parentUnlocked(db, { familyId: other.familyId, secret: SECRET, token })).toBe(false);
  });

  it("pauses entry after five wrong Parent PINs, even for the right one", async () => {
    const { db, familyId } = await withParentPin();
    const now = new Date();
    for (let i = 0; i < 5; i++) await enterParentPin(db, { familyId, pin: "0000", secret: SECRET, now });

    const paused = await enterParentPin(db, { familyId, pin: "7316", secret: SECRET, now });
    expect(paused).toMatchObject({ ok: false });
    expect(paused.ok ? null : paused.pausedUntil?.getTime()).toBeGreaterThan(now.getTime());

    const later = new Date(now.getTime() + 61_000);
    expect((await enterParentPin(db, { familyId, pin: "7316", secret: SECRET, now: later })).ok).toBe(true);
  });

  it("lets a Parent change or remove the Parent PIN", async () => {
    const { db, familyId } = await withParentPin();

    await setParentPin(db, familyId, "2468");
    expect((await enterParentPin(db, { familyId, pin: "7316", secret: SECRET })).ok).toBe(false);
    expect((await enterParentPin(db, { familyId, pin: "2468", secret: SECRET })).ok).toBe(true);
    await setParentPin(db, familyId, null);
    expect(await parentUnlocked(db, { familyId, secret: SECRET, token: undefined })).toBe(true);
  });

  it("lets a Parent who just signed in with Google past a forgotten Parent PIN", async () => {
    const { db, familyId } = await withParentPin();
    const now = new Date();
    const justNow = new Date(now.getTime() - 60_000);
    const anHourAgo = new Date(now.getTime() - 60 * 60_000);

    expect(
      await parentUnlocked(db, { familyId, secret: SECRET, token: undefined, signedInAt: justNow, now }),
    ).toBe(true);
    expect(
      await parentUnlocked(db, { familyId, secret: SECRET, token: undefined, signedInAt: anHourAgo, now }),
    ).toBe(false);
  });

  it("accepts only four digits", async () => {
    const db = await testDb();
    const { familyId } = await familyWithChild(db);

    await expect(setParentPin(db, familyId, "12a4")).rejects.toBeInstanceOf(PinError);
    await expect(setParentPin(db, familyId, "123")).rejects.toBeInstanceOf(PinError);
  });
});
