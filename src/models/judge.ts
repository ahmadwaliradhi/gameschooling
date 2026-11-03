import { MODELS } from "./ids";
import { runJudge, summarize, type JudgeInput, type JudgeOutput } from "./judging";
import type { CallContext } from "./log";

// Judge: Muse Spark 1.3 checks the Proof. Audio never goes here, only transcripts.

export function judge(ctx: CallContext, input: JudgeInput): Promise<JudgeOutput> {
  return runJudge(ctx, input, {
    agent: "judge",
    provider: "meta",
    model: MODELS.spark,
    inputSummary: summarize(input),
  });
}
