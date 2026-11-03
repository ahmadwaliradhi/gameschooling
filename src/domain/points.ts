import type { PointsEntry } from "./family-rules";
import type { Outcome } from "./verdict";

export { balance, type PointsEntry, type PointsKind } from "./family-rules";

export function pointsForModelVerdict(outcome: Outcome, questPoints: number): PointsEntry[] {
  return outcome === "accepted" ? [{ kind: "earned", amount: questPoints }] : [];
}

export type ParentChoice = "accept" | "reject";

// `paid` is what this Verdict has already moved into the balance.
export function parentDecision(
  verdict: { outcome: Outcome; paid: number; points: number },
  choice: ParentChoice,
): { outcome: Outcome; entries: PointsEntry[] } {
  const outcome: Outcome = choice === "accept" ? "accepted" : "not_yet";
  const target = choice === "accept" ? verdict.points : 0;
  const delta = target - verdict.paid;
  if (delta === 0) return { outcome, entries: [] };
  // Deciding a waiting Proof is the first decision; changing a decided one is an overrule.
  const kind = verdict.outcome === "needs_parent" ? "earned" : "overrule";
  return { outcome, entries: [{ kind, amount: delta }] };
}

export type Reward = { name: string; price: number };

export class RewardNotReachedError extends Error {}

export function giveReward(currentBalance: number, reward: Reward): PointsEntry {
  if (currentBalance < reward.price) {
    throw new RewardNotReachedError(`${reward.name} needs ${reward.price} Points`);
  }
  return { kind: "reward_given", amount: -reward.price };
}

export function nextReward<R extends Reward>(
  currentBalance: number,
  rewards: readonly R[],
): (R & { remaining: number }) | null {
  const byPrice = [...rewards].sort((a, b) => a.price - b.price);
  const next = byPrice.find((r) => r.price > currentBalance) ?? byPrice.at(-1);
  return next ? { ...next, remaining: Math.max(0, next.price - currentBalance) } : null;
}
