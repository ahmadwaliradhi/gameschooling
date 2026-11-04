import { describe, expect, it } from "vitest";
import { deps, familyWithChild, fakeClient, json, questFor, testDb } from "#/test/harness";
import { checkProof, decideAsParent } from "./check-proof";
import { setChildSettings } from "./family";
import { chooseStake, StakeError } from "./stakes";
import { childView, parentView, questForChild } from "./views";

const verdict = (decision: "pass" | "fail", confidence = 0.9) => ({
  decision,
  confidence,
  reason: `${decision} because`,
  description: "",
});
const judges = (a: "pass" | "fail", b: "pass" | "fail") =>
  fakeClient({
    chat: async ({ provider }) =>
      provider === "meta" ? json(verdict(a)) : json(verdict(b), "meta-models/muse-spark-open-1026"),
  });
const typed = { kind: "text" as const, text: "Jakarta" };
const tenYearOld = { nickname: "Ali", birthYear: new Date().getFullYear() - 10 };

async function hardQuest() {
  const db = await testDb();
  const family = await familyWithChild(db, tenYearOld);
  const questId = await questFor(db, family.familyId, family.childId, {
    proofKind: "text",
    lookFor: [],
    points: 16,
  });
  return { db, ...family, questId };
}

describe("Stakes", () => {
  it("shows the Child what a Stake can win or lose before they accept", async () => {
    const { db, familyId, questId } = await hardQuest();

    const play = await questForChild(db, familyId, questId);

    expect(play?.stakeOffers).toEqual([
      { multiplier: 1.5, bonus: 8 },
      { multiplier: 2, bonus: 16 },
    ]);
  });

  it("pays the bonus on top of the Quest's Points when the Verdict is accepted", async () => {
    const { db, familyId, childId, questId } = await hardQuest();
    await chooseStake(db, { familyId, questId, multiplier: 2 });

    await checkProof(deps(db, judges("pass", "pass")), { familyId, questId, proof: typed });

    expect((await childView(db, familyId, childId)).points).toBe(32);
    expect((await parentView(db, familyId, childId)).pointsLog.map((e) => [e.kind, e.amount])).toEqual([
      ["earned", 16],
      ["stake_won", 16],
    ]);
  });

  it("costs only the bonus when the Verdict is not yet, never Points already earned", async () => {
    const { db, familyId, childId, questId } = await hardQuest();
    const easy = await questFor(db, familyId, childId, { proofKind: "text", lookFor: [], points: 10 });
    await checkProof(deps(db, judges("pass", "pass")), { familyId, questId: easy, proof: typed });
    await chooseStake(db, { familyId, questId, multiplier: 1.5 });

    await checkProof(deps(db, judges("fail", "fail")), { familyId, questId, proof: typed });

    expect((await childView(db, familyId, childId)).points).toBe(10);
    expect((await parentView(db, familyId, childId)).pointsLog.map((e) => e.kind)).toContain("stake_lost");
  });

  it("settles a Stake only once the Parent decides a Proof that waited", async () => {
    const { db, familyId, childId, parentId, questId } = await hardQuest();
    await chooseStake(db, { familyId, questId, multiplier: 1.5 });
    const { verdictId } = await checkProof(deps(db, judges("pass", "fail")), {
      familyId,
      questId,
      proof: typed,
    });
    expect((await parentView(db, familyId, childId)).pointsLog).toEqual([]);

    await decideAsParent(db, { familyId, parentId, verdictId, choice: "accept" });

    expect((await childView(db, familyId, childId)).points).toBe(24);
  });

  it("takes the bonus back with the Quest's Points when a Parent overrules", async () => {
    const { db, familyId, childId, parentId, questId } = await hardQuest();
    await chooseStake(db, { familyId, questId, multiplier: 2 });
    const { verdictId } = await checkProof(deps(db, judges("pass", "pass")), {
      familyId,
      questId,
      proof: typed,
    });

    await decideAsParent(db, { familyId, parentId, verdictId, choice: "reject" });

    expect((await childView(db, familyId, childId)).points).toBe(0);
  });

  it("applies a Stake to one Proof only; a retry starts without one", async () => {
    const { db, familyId, childId, questId } = await hardQuest();
    await chooseStake(db, { familyId, questId, multiplier: 2 });
    await checkProof(deps(db, judges("fail", "fail")), { familyId, questId, proof: typed });

    await checkProof(deps(db, judges("pass", "pass")), { familyId, questId, proof: typed });

    expect((await childView(db, familyId, childId)).points).toBe(16);
  });

  it("is off by default under 8 and follows the Parent's switch", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const questId = await questFor(db, familyId, childId, { points: 18 });

    expect((await questForChild(db, familyId, questId))?.stakeOffers).toEqual([]);
    await expect(chooseStake(db, { familyId, questId, multiplier: 2 })).rejects.toBeInstanceOf(StakeError);

    await setChildSettings(db, familyId, childId, { stakes: true });
    await chooseStake(db, { familyId, questId, multiplier: 2 });
    expect((await questForChild(db, familyId, questId))?.quest.stakeMultiplier).toBe(2);

    await setChildSettings(db, familyId, childId, { stakes: false });
    expect((await questForChild(db, familyId, questId))?.stakeOffers).toEqual([]);
  });

  it("refuses Stakes on easier Quests", async () => {
    const { db, familyId, childId } = await hardQuest();
    const easy = await questFor(db, familyId, childId, { points: 10 });

    await expect(chooseStake(db, { familyId, questId: easy, multiplier: 2 })).rejects.toBeInstanceOf(
      StakeError,
    );
  });
});
