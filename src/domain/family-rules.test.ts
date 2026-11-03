import { describe, expect, it } from "vitest";
import {
  balance,
  familyGoal,
  siblingBoard,
  streak,
  settleStake,
  stakeBonus,
  stakeOffers,
  stakesAllowed,
} from "./family-rules";

describe("balance", () => {
  it("adds learning Points, bonus Points and Rewards", () => {
    expect(
      balance([
        { kind: "earned", amount: 20 },
        { kind: "stake_won", amount: 10 },
        { kind: "reward_given", amount: -15 },
      ]),
    ).toBe(15);
  });

  it("never drops below the Points earned from learning minus Rewards given", () => {
    expect(
      balance([
        { kind: "earned", amount: 20 },
        { kind: "stake_won", amount: 10 },
        { kind: "reward_given", amount: -25 },
        { kind: "overrule", amount: -20 },
        { kind: "stake_lost", amount: -10 },
      ]),
    ).toBe(-25);
    expect(
      balance([
        { kind: "earned", amount: 12 },
        { kind: "stake_lost", amount: 0 },
        { kind: "stake_lost", amount: -6 },
      ]),
    ).toBe(12);
  });
});

describe("Stakes", () => {
  it("are off by default under 8, on from 8, and a Parent's choice always wins", () => {
    expect(stakesAllowed({ age: 7, stakes: null })).toBe(false);
    expect(stakesAllowed({ age: 8, stakes: null })).toBe(true);
    expect(stakesAllowed({ age: 12, stakes: false })).toBe(false);
    expect(stakesAllowed({ age: 6, stakes: true })).toBe(true);
  });

  it("are offered only on harder Quests, with the bonus shown before accepting", () => {
    expect(stakeOffers(10)).toEqual([]);
    expect(stakeOffers(16)).toEqual([
      { multiplier: 1.5, bonus: 8 },
      { multiplier: 2, bonus: 16 },
    ]);
    expect(stakeBonus(15, 1.5)).toBe(8);
  });

  it("pays the bonus when the Verdict is accepted and costs nothing more when it is not", () => {
    expect(settleStake({ bonus: 8, outcome: "accepted", settled: [] })).toEqual([
      { kind: "stake_won", amount: 8 },
    ]);
    expect(settleStake({ bonus: 8, outcome: "not_yet", settled: [] })).toEqual([
      { kind: "stake_lost", amount: 0 },
    ]);
  });

  it("waits while the Proof waits for the Parent", () => {
    expect(settleStake({ bonus: 8, outcome: "needs_parent", settled: [] })).toEqual([]);
  });

  it("follows a Parent's overrule and never settles twice", () => {
    const won = [{ kind: "stake_won" as const, amount: 8 }];
    expect(settleStake({ bonus: 8, outcome: "accepted", settled: won })).toEqual([]);
    expect(settleStake({ bonus: 8, outcome: "not_yet", settled: won })).toEqual([
      { kind: "stake_lost", amount: -8 },
    ]);
    const lost = [...won, { kind: "stake_lost" as const, amount: -8 }];
    expect(settleStake({ bonus: 8, outcome: "accepted", settled: lost })).toEqual([
      { kind: "stake_won", amount: 8 },
    ]);
  });
});

// Wednesday; its week started on Monday 2 November.
const now = new Date("2026-11-04T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const at = (weeksAgo: number, days = 0) => new Date(now.getTime() - weeksAgo * 7 * DAY + days * DAY);
const earnedIn = (weeksAgo: number[], childId = "a", amount = 10) =>
  weeksAgo.map((w) => ({ kind: "earned" as const, amount, at: at(w), childId }));

describe("Streak", () => {
  it("counts weeks with Points, not days", () => {
    const entries = [
      ...earnedIn([1, 2, 3]),
      { kind: "earned" as const, amount: 5, at: at(1, 1), childId: "a" },
    ];
    expect(streak({ entries, age: 7, now })).toEqual({ weeks: 3, freezes: 0 });
  });

  it("adds this week as soon as the Child earns, and does not break before the week is over", () => {
    expect(streak({ entries: earnedIn([0, 1]), age: 7, now })).toEqual({ weeks: 2, freezes: 0 });
    expect(streak({ entries: earnedIn([1]), age: 7, now })).toEqual({ weeks: 1, freezes: 0 });
  });

  it("breaks on a missed week when no freeze is held", () => {
    expect(streak({ entries: earnedIn([1, 3]), age: 7, now })).toEqual({ weeks: 1, freezes: 0 });
    expect(streak({ entries: earnedIn([3]), age: 7, now })).toEqual({ weeks: 0, freezes: 0 });
  });

  it("grants a freeze every four weeks and spends it on a missed week automatically", () => {
    expect(streak({ entries: earnedIn([4, 3, 2, 1]), age: 7, now })).toEqual({ weeks: 4, freezes: 1 });
    expect(streak({ entries: earnedIn([6, 5, 4, 3, 1]), age: 7, now })).toEqual({ weeks: 5, freezes: 0 });
  });

  it("holds at most two freezes", () => {
    const twelve = earnedIn([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(streak({ entries: twelve, age: 7, now })).toEqual({ weeks: 12, freezes: 2 });
  });

  it("counts only Points earned for learning", () => {
    const entries = [
      { kind: "stake_won" as const, amount: 8, at: at(1), childId: "a" },
      { kind: "reward_given" as const, amount: -10, at: at(1), childId: "a" },
    ];
    expect(streak({ entries, age: 7, now })).toEqual({ weeks: 0, freezes: 0 });
  });

  it("is hidden for Children under 5", () => {
    expect(streak({ entries: earnedIn([1, 2]), age: 4, now })).toBeNull();
  });
});

const kids = [
  { id: "a", age: 9, siblingBoard: false },
  { id: "b", age: 6, siblingBoard: false },
];

describe("Family Goal", () => {
  const goal = { target: 50, rewardName: "pizza night", givenAt: null };

  it("fills with every Child's learning Points this week", () => {
    const entries = [
      ...earnedIn([0], "a", 20),
      ...earnedIn([0], "b", 15),
      ...earnedIn([1], "b", 40),
      { kind: "stake_won" as const, amount: 10, at: at(0), childId: "a" },
    ];
    expect(familyGoal({ entries, children: kids, now, goal, enabled: true })).toEqual({
      target: 50,
      rewardName: "pizza night",
      progress: 35,
      reached: false,
      given: false,
    });
  });

  it("is reached at the target and closes when the Parent marks the Reward given", () => {
    const entries = [...earnedIn([0], "a", 30), ...earnedIn([0], "b", 25)];
    expect(familyGoal({ entries, children: kids, now, goal, enabled: true })).toMatchObject({
      reached: true,
      given: false,
    });
    const given = { ...goal, givenAt: at(0, 1) };
    expect(familyGoal({ entries, children: kids, now, goal: given, enabled: true })).toMatchObject({
      given: true,
    });
  });

  it("starts with a target from the Children's ages when the Parent has not set one", () => {
    expect(familyGoal({ entries: [], children: kids, now, goal: null, enabled: true })).toMatchObject({
      target: 80,
      progress: 0,
    });
  });

  it("is not shown with one Child, or when the Parent turned it off", () => {
    expect(familyGoal({ entries: [], children: [kids[0]!], now, goal, enabled: true })).toBeNull();
    expect(familyGoal({ entries: [], children: kids, now, goal, enabled: false })).toBeNull();
  });
});

describe("Sibling Board", () => {
  const four = [
    { id: "a", age: 10, siblingBoard: true },
    { id: "b", age: 6, siblingBoard: true },
    { id: "c", age: 8, siblingBoard: true },
    { id: "d", age: 12, siblingBoard: true },
  ];

  it("ranks this week's Points against what each Child's age expects", () => {
    const entries = [...earnedIn([0], "a", 40), ...earnedIn([0], "b", 30)];
    expect(siblingBoard({ entries, children: four.slice(0, 2), viewerId: "a", now })).toEqual([
      { childId: "b", progress: 100, me: false },
      { childId: "a", progress: 80, me: true },
    ]);
  });

  it("forgets earlier weeks", () => {
    const entries = [...earnedIn([1], "a", 500), ...earnedIn([0], "b", 3)];
    expect(siblingBoard({ entries, children: four.slice(0, 2), viewerId: "a", now })?.[0]).toMatchObject({
      childId: "b",
    });
  });

  it("shows only the siblings next to the viewer", () => {
    const entries = [
      ...earnedIn([0], "a", 50),
      ...earnedIn([0], "b", 24),
      ...earnedIn([0], "c", 20),
      ...earnedIn([0], "d", 6),
    ];
    // a 100%, b 80%, c 50%, d 10%
    expect(siblingBoard({ entries, children: four, viewerId: "c", now })?.map((r) => r.childId)).toEqual([
      "b",
      "c",
      "d",
    ]);
    expect(siblingBoard({ entries, children: four, viewerId: "a", now })?.map((r) => r.childId)).toEqual([
      "a",
      "b",
    ]);
  });

  it("leaves out siblings who did not opt in, and shows nothing to a Child who did not", () => {
    const children = [...four.slice(0, 2), { id: "c", age: 8, siblingBoard: false }];
    expect(
      siblingBoard({ entries: [], children, viewerId: "a", now })
        ?.map((r) => r.childId)
        .sort(),
    ).toEqual(["a", "b"]);
    expect(siblingBoard({ entries: [], children, viewerId: "c", now })).toBeNull();
  });

  it("shows nothing when no other sibling opted in", () => {
    const children = [four[0]!, { id: "b", age: 6, siblingBoard: false }];
    expect(siblingBoard({ entries: [], children, viewerId: "a", now })).toBeNull();
  });
});
