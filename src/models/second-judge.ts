import { ModelError } from "./client";
import { MODELS } from "./ids";
import { runJudge, summarize, type JudgeInput, type JudgeOutput } from "./judging";
import type { CallContext } from "./log";

// Second judge: open-weight Muse Spark Open on Baseten, judging independently.
// If Baseten rejects the photo, it judges from SAM findings and the first judge's description.

export async function secondJudge(
  ctx: CallContext,
  input: JudgeInput,
  // The first judge's description of the photo, only awaited for the text-only fallback.
  describePhoto: () => Promise<string>,
): Promise<JudgeOutput & { textOnly: boolean }> {
  const run = async (textOnly: boolean) => {
    const photoDescription = textOnly ? await describePhoto() : undefined;
    const output = await runJudge(ctx, input, {
      agent: "second_judge",
      provider: "baseten",
      model: MODELS.sparkOpen,
      inputSummary: textOnly ? `text only: ${summarize(input)}` : summarize(input),
      photoDescription,
    });
    return { ...output, textOnly };
  };
  try {
    return await run(false);
  } catch (e) {
    const rejected = e instanceof ModelError && e.status !== null && e.status >= 400 && e.status < 500;
    if (input.evidence.kind !== "photo" || !rejected) throw e;
    return run(true);
  }
}
