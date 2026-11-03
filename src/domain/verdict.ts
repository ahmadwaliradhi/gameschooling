export type JudgeDecision = "pass" | "fail";
export type JudgeResult = { decision: JudgeDecision; confidence: number };
export type Outcome = "accepted" | "not_yet" | "needs_parent";

export const CONFIDENT = 0.7;

export function decideOutcome(input: { judges: JudgeResult[]; recitation: boolean }): Outcome {
  if (input.recitation) return "needs_parent";
  const [first, ...rest] = input.judges;
  if (!first || rest.some((j) => j.decision !== first.decision)) return "needs_parent";
  if (input.judges.some((j) => j.confidence < CONFIDENT)) return "needs_parent";
  return first.decision === "pass" ? "accepted" : "not_yet";
}
