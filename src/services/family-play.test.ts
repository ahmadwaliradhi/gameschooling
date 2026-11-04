import { describe, expect, it } from "vitest";
import { pointsLog } from "#/db/schema";
import type { Db } from "#/db";
import { familyWithChild, testDb } from "#/test/harness";
import { addChild, setChildSettings } from "./family";
import { familyGoalView, giveFamilyGoal, setFamilyGoal, setFamilyGoalOn } from "./family-goal";
import { childView } from "./views";

const year = new Date().getFullYear();

async function earn(db: Db, familyId: string, childId: string, amount: number, daysAgo = 0) {
  await db.insert(pointsLog).values({
    familyId,
    childId,
    kind: "earned",
    amount,
    createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  });
}

async function twoChildren() {
  const db = await testDb();
  const family = await familyWithChild(db, { nickname: "Ali", birthYear: year - 10 });
  const siblingId = await addChild(db, family.familyId, { nickname: "Kiki", birthYear: year - 6 });
  return { db, ...family, siblingId };
}

describe("Streak on the Child's screen", () => {
  it("shows weeks with Points", async () => {
    const { db, familyId, childId } = await twoChildren();
    await earn(db, familyId, childId, 10, 7);
    await earn(db, familyId, childId, 10, 0);

    expect((await childView(db, familyId, childId)).streak?.weeks).toBeGreaterThanOrEqual(1);
  });

  it("is hidden under 5", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db, { nickname: "Bo", birthYear: year - 4 });
    await earn(db, familyId, childId, 10);

    expect((await childView(db, familyId, childId)).streak).toBeNull();
  });
});

describe("Family Goal", () => {
  it("is on by default with two Children and fills from both", async () => {
    const { db, familyId, childId, siblingId } = await twoChildren();
    await earn(db, familyId, childId, 20);
    await earn(db, familyId, siblingId, 5);

    const goal = (await childView(db, familyId, siblingId)).familyGoal;
    expect(goal).toMatchObject({ progress: 25, target: 80, reached: false });
  });

  it("is not shown in a Family with one Child", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);

    expect((await childView(db, familyId, childId)).familyGoal).toBeNull();
  });

  it("uses the Parent's target and Reward, and keeps them for next week", async () => {
    const { db, familyId, childId } = await twoChildren();
    await setFamilyGoal(db, familyId, { target: 30, rewardName: "pizza night" });
    await earn(db, familyId, childId, 30);

    expect(await familyGoalView(db, familyId)).toMatchObject({
      target: 30,
      rewardName: "pizza night",
      reached: true,
    });
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(await familyGoalView(db, familyId, nextWeek)).toMatchObject({
      target: 30,
      rewardName: "pizza night",
      progress: 0,
    });
  });

  it("closes when the Parent marks the shared Reward given, without spending anyone's Points", async () => {
    const { db, familyId, childId } = await twoChildren();
    await setFamilyGoal(db, familyId, { target: 30, rewardName: "pizza night" });
    await earn(db, familyId, childId, 30);

    await giveFamilyGoal(db, familyId);

    expect(await familyGoalView(db, familyId)).toMatchObject({ given: true });
    expect((await childView(db, familyId, childId)).points).toBe(30);
  });

  it("can be switched off by the Parent", async () => {
    const { db, familyId, childId } = await twoChildren();

    await setFamilyGoalOn(db, familyId, false);

    expect((await childView(db, familyId, childId)).familyGoal).toBeNull();
  });
});

describe("Sibling Board", () => {
  it("is off until a Parent turns it on for each Child", async () => {
    const { db, familyId, childId, siblingId } = await twoChildren();
    expect((await childView(db, familyId, childId)).siblingBoard).toBeNull();

    await setChildSettings(db, familyId, childId, { siblingBoard: true });
    expect((await childView(db, familyId, childId)).siblingBoard).toBeNull();

    await setChildSettings(db, familyId, siblingId, { siblingBoard: true });
    await earn(db, familyId, siblingId, 30);
    await earn(db, familyId, childId, 25);
    expect((await childView(db, familyId, childId)).siblingBoard).toEqual([
      { childId: siblingId, nickname: "Kiki", progress: 100, me: false },
      { childId, nickname: "Ali", progress: 50, me: true },
    ]);
  });
});
