import { and, desc, eq, lt } from "drizzle-orm";
import type { Db } from "#/db";
import { children, families, familyGoals, pointsLog } from "#/db/schema";
import { familyGoal, weekStart, type DatedEntry, type FamilyChild } from "#/domain/family-rules";
import { ageOf } from "#/domain/quest";

// The week's Monday as "YYYY-MM-DD".
export function weekKey(date: Date): string {
  return weekStart(date).toISOString().slice(0, 10);
}

// The whole Family's Points log with dates, for the family rules.
export async function familyEntries(db: Db, familyId: string): Promise<DatedEntry[]> {
  const rows = await db
    .select({
      kind: pointsLog.kind,
      amount: pointsLog.amount,
      at: pointsLog.createdAt,
      childId: pointsLog.childId,
    })
    .from(pointsLog)
    .where(eq(pointsLog.familyId, familyId));
  return rows;
}

export async function familyChildren(db: Db, familyId: string, now = new Date()) {
  const rows = await db.query.children.findMany({ where: eq(children.familyId, familyId) });
  return rows.map((c) => ({
    id: c.id,
    nickname: c.nickname,
    age: ageOf(c.birthYear, now),
    siblingBoard: c.siblingBoard,
  })) satisfies FamilyChild[];
}

// This week's goal row, or last set target and Reward carried into this week.
async function goalFor(db: Db, familyId: string, week: string) {
  const own = await db.query.familyGoals.findFirst({
    where: and(eq(familyGoals.familyId, familyId), eq(familyGoals.week, week)),
  });
  if (own) return own;
  const last = await db.query.familyGoals.findFirst({
    where: and(eq(familyGoals.familyId, familyId), lt(familyGoals.week, week)),
    orderBy: desc(familyGoals.week),
  });
  return last ? { ...last, givenAt: null } : null;
}

export async function familyGoalView(db: Db, familyId: string, now = new Date()) {
  const family = await db.query.families.findFirst({ where: eq(families.id, familyId) });
  return familyGoal({
    entries: await familyEntries(db, familyId),
    children: await familyChildren(db, familyId, now),
    now,
    goal: await goalFor(db, familyId, weekKey(now)),
    enabled: family?.familyGoal ?? true,
  });
}

async function upsertWeek(
  db: Db,
  familyId: string,
  week: string,
  values: { target: number; rewardName: string; givenAt?: Date | null },
) {
  await db
    .insert(familyGoals)
    .values({ familyId, week, ...values })
    .onConflictDoUpdate({ target: [familyGoals.familyId, familyGoals.week], set: values });
}

export async function setFamilyGoal(
  db: Db,
  familyId: string,
  goal: { target: number; rewardName: string },
  now = new Date(),
) {
  await upsertWeek(db, familyId, weekKey(now), {
    target: Math.max(1, Math.round(goal.target)),
    rewardName: goal.rewardName.trim(),
  });
}

// The Parent gave the shared Reward. No one's Points are spent.
export async function giveFamilyGoal(db: Db, familyId: string, now = new Date()) {
  const view = await familyGoalView(db, familyId, now);
  if (!view) return;
  await upsertWeek(db, familyId, weekKey(now), {
    target: view.target,
    rewardName: view.rewardName,
    givenAt: now,
  });
}

export async function setFamilyGoalOn(db: Db, familyId: string, on: boolean) {
  await db.update(families).set({ familyGoal: on }).where(eq(families.id, familyId));
}
