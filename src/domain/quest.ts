import type { Outcome } from "./verdict";

export type ProofKind = "photo" | "voice" | "text" | "worksheet";

export const TYPING_AGE = 8;
export const WORKSHEET_AGE = 6;

export function proofKindFor(wanted: ProofKind, age: number): ProofKind {
  if (wanted === "text" && age < TYPING_AGE) return "voice";
  if (wanted === "worksheet" && age < WORKSHEET_AGE) return "photo";
  return wanted;
}

export function questPoints(points: number): number {
  return Math.min(20, Math.max(5, Math.round(points)));
}

export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

// A Worksheet Proof's Verdict from its answers' Verdicts. Each accepted answer earns its share of the
// Quest's Points, so one wrong answer never fails the page. A Stake needs every answer right.
export function worksheetVerdict(
  answers: readonly Outcome[],
  questPoints: number,
): { outcome: Outcome; points: number; stakeOutcome: Outcome } {
  if (answers.length === 0 || answers.includes("needs_parent")) {
    return { outcome: "needs_parent", points: 0, stakeOutcome: "needs_parent" };
  }
  const accepted = answers.filter((a) => a === "accepted").length;
  return {
    outcome: accepted > 0 ? "accepted" : "not_yet",
    points: Math.round((questPoints * accepted) / answers.length),
    stakeOutcome: accepted === answers.length ? "accepted" : "not_yet",
  };
}
