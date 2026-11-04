import type { Outcome } from "./verdict";

// The family rules: everything that turns the Points log into what a Parent or Child sees.
// Pure: the log, the Family's Children and a date in, values out.

export type PointsKind = "earned" | "reward_given" | "overrule" | "stake_won" | "stake_lost";
export type PointsEntry = { kind: PointsKind; amount: number };

const isStake = (kind: PointsKind) => kind === "stake_won" || kind === "stake_lost";

// Stakes only move bonus Points: their net never counts below zero, so a lost Stake can never take
// Points earned for learning.
export function balance(entries: readonly PointsEntry[]): number {
  let rest = 0;
  let stakes = 0;
  for (const e of entries) {
    if (isStake(e.kind)) stakes += e.amount;
    else rest += e.amount;
  }
  return rest + Math.max(0, stakes);
}

// Stakes: a Child may risk a bonus on a harder Quest. Losing costs only that bonus.

export const STAKE_AGE = 8;
export const STAKE_MIN_POINTS = 15;
export const STAKE_MULTIPLIERS = [1.5, 2] as const;

// `stakes` is the Parent's switch for this Child; null means the default for their age.
export function stakesAllowed(child: { age: number; stakes: boolean | null }): boolean {
  return child.stakes ?? child.age >= STAKE_AGE;
}

export function stakeBonus(questPoints: number, multiplier: number): number {
  return Math.round(questPoints * (multiplier - 1));
}

export function stakeOffers(questPoints: number): { multiplier: number; bonus: number }[] {
  if (questPoints < STAKE_MIN_POINTS) return [];
  return STAKE_MULTIPLIERS.map((multiplier) => ({ multiplier, bonus: stakeBonus(questPoints, multiplier) }));
}

// The Points entries that bring a Stake in line with its Verdict. `settled` is what this Verdict's
// Stake already wrote. Only a final Verdict settles; a Parent's overrule moves it again.
export function settleStake(input: {
  bonus: number;
  outcome: Outcome;
  settled: readonly PointsEntry[];
}): PointsEntry[] {
  if (input.outcome === "needs_parent") return [];
  const last = [...input.settled].reverse().find((e) => isStake(e.kind));
  const paid = input.settled.reduce((sum, e) => sum + (isStake(e.kind) ? e.amount : 0), 0);
  if (input.outcome === "accepted") {
    return last?.kind === "stake_won" ? [] : [{ kind: "stake_won", amount: input.bonus - paid }];
  }
  return last?.kind === "stake_lost" ? [] : [{ kind: "stake_lost", amount: 0 - paid }];
}

// Weeks start on Monday, in UTC.

export type DatedEntry = PointsEntry & { at: Date; childId: string };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weekStart(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - sinceMonday * 24 * 60 * 60 * 1000);
}

const isLearning = (kind: PointsKind) => kind === "earned" || kind === "overrule";

// Points earned for learning in the week that contains `week`.
export function weekPoints(entries: readonly DatedEntry[], childId: string, week: Date): number {
  const start = weekStart(week).getTime();
  return entries
    .filter((e) => e.childId === childId && isLearning(e.kind) && weekStart(e.at).getTime() === start)
    .reduce((sum, e) => sum + e.amount, 0);
}

// Streaks: a week counts if the Child earned any Points in it. Freezes are never bought.

export const STREAK_AGE = 5;
export const WEEKS_PER_FREEZE = 4;
export const MAX_FREEZES = 2;

export function streak(input: {
  entries: readonly DatedEntry[];
  age: number;
  now: Date;
}): { weeks: number; freezes: number } | null {
  if (input.age < STREAK_AGE) return null;
  const learning = input.entries.filter((e) => isLearning(e.kind));
  const byWeek = new Map<number, number>();
  for (const e of learning) {
    const w = weekStart(e.at).getTime();
    byWeek.set(w, (byWeek.get(w) ?? 0) + e.amount);
  }
  const counted = (w: number) => (byWeek.get(w) ?? 0) > 0;
  const current = weekStart(input.now).getTime();
  const first = Math.min(...[...byWeek.keys()].filter((w) => counted(w)));
  let weeks = 0;
  let freezes = 0;
  const count = () => {
    weeks += 1;
    if (weeks % WEEKS_PER_FREEZE === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  };
  for (let w = first; w < current; w += WEEK_MS) {
    if (counted(w)) count();
    else if (freezes > 0) freezes -= 1;
    else weeks = 0;
  }
  // This week counts once earned; until then it is still in progress.
  if (counted(current)) count();
  return { weeks, freezes };
}

// What a Child of this age is expected to earn in a week. Sets the default Family Goal and evens out
// the Sibling Board.
export function expectedWeeklyPoints(age: number): number {
  if (age < 5) return 20;
  if (age < 7) return 30;
  if (age < 9) return 40;
  if (age < 11) return 50;
  return 60;
}

export type FamilyChild = { id: string; age: number; siblingBoard: boolean };

// Family Goal: one shared weekly target and Reward. Shown only with two or more Children.
export function familyGoal(input: {
  entries: readonly DatedEntry[];
  children: readonly FamilyChild[];
  now: Date;
  goal: { target: number; rewardName: string; givenAt: Date | null } | null;
  enabled: boolean;
}): { target: number; rewardName: string; progress: number; reached: boolean; given: boolean } | null {
  if (!input.enabled || input.children.length < 2) return null;
  const target =
    input.goal?.target ?? input.children.reduce((sum, c) => sum + expectedWeeklyPoints(c.age), 0);
  const progress = input.children.reduce((sum, c) => sum + weekPoints(input.entries, c.id, input.now), 0);
  return {
    target,
    rewardName: input.goal?.rewardName ?? DEFAULT_FAMILY_REWARD,
    progress,
    reached: progress >= target,
    given: input.goal?.givenAt != null,
  };
}

export const DEFAULT_FAMILY_REWARD = "Family treat";

// Sibling Board: only Children who opted in, ranked by this week's age-adjusted progress, and only
// the neighbours just above and below the viewer.
export function siblingBoard(input: {
  entries: readonly DatedEntry[];
  children: readonly FamilyChild[];
  viewerId: string;
  now: Date;
}): { childId: string; progress: number; me: boolean }[] | null {
  const players = input.children.filter((c) => c.siblingBoard);
  if (!players.some((c) => c.id === input.viewerId) || players.length < 2) return null;
  const ranked = players
    .map((c) => ({
      childId: c.id,
      progress: Math.round((100 * weekPoints(input.entries, c.id, input.now)) / expectedWeeklyPoints(c.age)),
      me: c.id === input.viewerId,
    }))
    .sort((a, b) => b.progress - a.progress);
  const i = ranked.findIndex((r) => r.me);
  return ranked.slice(Math.max(0, i - 1), i + 2);
}
