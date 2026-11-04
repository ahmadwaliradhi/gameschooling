import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { ConsequenceError, consequencesFor, recordConsequence } from "./consequences";
import { addChild } from "./family";
import { childView, parentView } from "./views";

describe("Consequences", () => {
  it("records the privilege, the reason and which Parent decided", async () => {
    const db = await testDb();
    const { familyId, parentId, childId } = await familyWithChild(db);

    await recordConsequence(db, {
      familyId,
      parentId,
      childId,
      privilege: "No tablet tonight",
      reason: "Hit his sister",
    });

    const [c] = (await parentView(db, familyId, childId)).consequences;
    expect(c).toMatchObject({
      privilege: "No tablet tonight",
      reason: "Hit his sister",
      parentName: "Parent",
    });
  });

  it("refuses a Consequence without a reason", async () => {
    const db = await testDb();
    const { familyId, parentId, childId } = await familyWithChild(db);

    await expect(
      recordConsequence(db, { familyId, parentId, childId, privilege: "No tablet", reason: "  " }),
    ).rejects.toBeInstanceOf(ConsequenceError);
  });

  it("never touches Points and is never shown on a Child's screen", async () => {
    const db = await testDb();
    const { familyId, parentId, childId } = await familyWithChild(db);
    const siblingId = await addChild(db, familyId, { nickname: "Bo", birthYear: 2018 });

    await recordConsequence(db, { familyId, parentId, childId, privilege: "No park", reason: "Shouted" });

    expect((await parentView(db, familyId, childId)).points).toBe(0);
    for (const id of [childId, siblingId]) {
      expect(JSON.stringify(await childView(db, familyId, id))).not.toContain("Shouted");
    }
  });

  it("stays inside its Family", async () => {
    const db = await testDb();
    const a = await familyWithChild(db);
    const b = await familyWithChild(db);

    await expect(
      recordConsequence(db, {
        familyId: b.familyId,
        parentId: b.parentId,
        childId: a.childId,
        privilege: "x",
        reason: "y",
      }),
    ).rejects.toThrow();
    expect(await consequencesFor(db, a.familyId, a.childId)).toEqual([]);
  });
});
