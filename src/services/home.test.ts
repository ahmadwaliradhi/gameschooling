import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { removeChild } from "./family";
import { homeFor } from "./views";

describe("Where a device starts after sign-in", () => {
  it("opens the Child picker once the Family has a Child", async () => {
    const db = await testDb();
    const { familyId } = await familyWithChild(db);

    expect(await homeFor(db, familyId)).toBe("/play");
  });

  it("opens the Parent screens while the Family has no Children", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    await removeChild(db, familyId, childId);

    expect(await homeFor(db, familyId)).toBe("/parent");
  });
});
