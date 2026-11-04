import type { JudgeRecord } from "#/db/schema";
import { decideOutcome, type Outcome } from "#/domain/verdict";
import { MODELS } from "#/models/ids";
import { judge } from "#/models/judge";
import type { JudgeInput } from "#/models/judging";
import type { CallContext } from "#/models/log";
import { secondJudge } from "#/models/second-judge";

// Both judges on the same input, then the Verdict rule. A judge that failed leaves it to the Parent.
export async function judgePair(
  ctx: CallContext,
  input: JudgeInput,
  recitation: boolean,
): Promise<{ judges: JudgeRecord[]; outcome: Outcome }> {
  const first = judge(ctx, input).catch(() => null);
  const second = secondJudge(ctx, input, () => first.then((j) => j?.description ?? "")).catch(() => null);
  const [a, b] = await Promise.all([first, second]);
  const judges: JudgeRecord[] = [
    ...(a ? [judgeRecord(MODELS.spark, a, false)] : []),
    ...(b ? [judgeRecord(MODELS.sparkOpen, b, b.textOnly)] : []),
  ];
  const outcome: Outcome = judges.length === 2 ? decideOutcome({ judges, recitation }) : "needs_parent";
  return { judges, outcome };
}

function judgeRecord(
  model: string,
  j: { decision: JudgeRecord["decision"]; confidence: number; reason: string },
  textOnly: boolean,
): JudgeRecord {
  return { model, decision: j.decision, confidence: j.confidence, reason: j.reason, textOnly };
}
