import { describe, expect, it } from "vitest";
import {
  balance,
  nextReward,
  parentDecision,
  pointsForModelVerdict,
  rewardGiven,
  rewardReached,
} from "./points";

describe("Points log", () => {
  it("pays the Quest's Points only for an accepted Verdict", () => {
    expect(balance(pointsForModelVerdict("accepted", 15))).toBe(15);
    expect(balance(pointsForModelVerdict("not_yet", 15))).toBe(0);
    expect(balance(pointsForModelVerdict("needs_parent", 15))).toBe(0);
  });
});

describe("Parent decision", () => {
  it("pays the Points as earned when a Parent accepts a Proof that was waiting", () => {
    const result = parentDecision({ outcome: "needs_parent", paid: 0, points: 10 }, "accept");
    expect(result.outcome).toBe("accepted");
    expect(result.entries).toEqual([{ kind: "earned", amount: 10 }]);
  });

  it("writes an overrule that takes Points back when a Parent rejects an accepted Verdict", () => {
    const result = parentDecision({ outcome: "accepted", paid: 12, points: 12 }, "reject");
    expect(result.outcome).toBe("not_yet");
    expect(result.entries).toEqual([{ kind: "overrule", amount: -12 }]);
  });

  it("writes an overrule that pays Points when a Parent accepts a not-yet Verdict", () => {
    const result = parentDecision({ outcome: "not_yet", paid: 0, points: 8 }, "accept");
    expect(result.entries).toEqual([{ kind: "overrule", amount: 8 }]);
  });

  it("moves no Points when the Parent agrees with the models", () => {
    expect(parentDecision({ outcome: "accepted", paid: 5, points: 5 }, "accept").entries).toEqual([]);
    expect(parentDecision({ outcome: "not_yet", paid: 0, points: 5 }, "reject").entries).toEqual([]);
    expect(parentDecision({ outcome: "needs_parent", paid: 0, points: 5 }, "reject").entries).toEqual([]);
  });
});

describe("Rewards", () => {
  it("subtracts the Reward's price from the balance", () => {
    const log = [{ kind: "earned" as const, amount: 120 }];
    expect(rewardReached(balance(log), { name: "ice cream", price: 100 })).toBe(true);
    expect(balance([...log, rewardGiven({ name: "ice cream", price: 100 })])).toBe(20);
  });

  it("refuses a Reward the Child has not reached", () => {
    expect(rewardReached(40, { name: "ice cream", price: 100 })).toBe(false);
    expect(rewardReached(100, { name: "ice cream", price: 100 })).toBe(true);
  });

  it("shows the cheapest Reward not yet reached and how far away it is", () => {
    const rewards = [
      { name: "park", price: 50 },
      { name: "ice cream", price: 100 },
      { name: "sticker", price: 10 },
    ];
    expect(nextReward(30, rewards)).toEqual({ name: "park", price: 50, remaining: 20 });
    expect(nextReward(500, rewards)).toEqual({ name: "ice cream", price: 100, remaining: 0 });
    expect(nextReward(0, [])).toBeNull();
  });
});
