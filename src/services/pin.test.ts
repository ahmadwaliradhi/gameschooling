import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { childUnlocked, enterPin, PinError, setPin, unlockToken } from "./pin";
import { sidebar } from "./views";

const SECRET = "test-secret";

async function withPin(pin = "4821") {
  const db = await testDb();
  const family = await familyWithChild(db);
  await setPin(db, family.familyId, family.childId, pin);
  return { db, ...family };
}

describe("Child PIN", () => {
  it("opens with one tap when the Child has no PIN", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);

    expect((await sidebar(db, familyId))[0]!.hasPin).toBe(false);
    expect(await childUnlocked(db, { familyId, childId, secret: SECRET, token: undefined })).toBe(true);
  });

  it("lets the Child in with the right PIN and keeps siblings out without it", async () => {
    const { db, familyId, childId } = await withPin();
    expect((await sidebar(db, familyId))[0]!.hasPin).toBe(true);
    expect(await childUnlocked(db, { familyId, childId, secret: SECRET, token: undefined })).toBe(false);

    const wrong = await enterPin(db, { familyId, childId, pin: "1111", secret: SECRET });
    expect(wrong.ok).toBe(false);
    const right = await enterPin(db, { familyId, childId, pin: "4821", secret: SECRET });
    expect(right.ok).toBe(true);
    const token = right.ok ? right.token : undefined;
    expect(await childUnlocked(db, { familyId, childId, secret: SECRET, token })).toBe(true);
  });

  it("does not let one Child's unlock open a sibling", async () => {
    const { db, familyId, childId } = await withPin();
    const other = await unlockToken(SECRET, familyId, "someone-else");

    expect(await childUnlocked(db, { familyId, childId, secret: SECRET, token: other })).toBe(false);
  });

  it("pauses entry after five wrong PINs, even for the right one", async () => {
    const { db, familyId, childId } = await withPin();
    const now = new Date();
    for (let i = 0; i < 5; i++) await enterPin(db, { familyId, childId, pin: "0000", secret: SECRET, now });

    const paused = await enterPin(db, { familyId, childId, pin: "4821", secret: SECRET, now });
    expect(paused).toMatchObject({ ok: false });
    expect(paused.ok ? null : paused.pausedUntil?.getTime()).toBeGreaterThan(now.getTime());

    const later = new Date(now.getTime() + 61_000);
    expect((await enterPin(db, { familyId, childId, pin: "4821", secret: SECRET, now: later })).ok).toBe(
      true,
    );
  });

  it("lets the Parent reset or remove a forgotten PIN", async () => {
    const { db, familyId, childId } = await withPin();

    await setPin(db, familyId, childId, "9999");
    expect((await enterPin(db, { familyId, childId, pin: "9999", secret: SECRET })).ok).toBe(true);
    await setPin(db, familyId, childId, null);
    expect(await childUnlocked(db, { familyId, childId, secret: SECRET, token: undefined })).toBe(true);
  });

  it("accepts only four digits", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);

    await expect(setPin(db, familyId, childId, "12a4")).rejects.toBeInstanceOf(PinError);
    await expect(setPin(db, familyId, childId, "12345")).rejects.toBeInstanceOf(PinError);
  });
});
