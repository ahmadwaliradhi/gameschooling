import { ModelError } from "./client";
import { MODELS } from "./ids";
import { parseJson } from "./json";
import { JudgeOutput, judgeMessages, judgeSchema, summarize, type JudgeInput } from "./judging";
import { recorded, type CallContext } from "./log";

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
    return recorded(
      ctx,
      {
        agent: "second_judge",
        model: MODELS.sparkOpen,
        endpoint: "baseten /v1/chat/completions",
        inputSummary: textOnly ? `text only: ${summarize(input)}` : summarize(input),
      },
      async () => {
        const res = await ctx.client.chat({
          provider: "baseten",
          model: MODELS.sparkOpen,
          effort: "medium",
          schema: judgeSchema,
          messages: judgeMessages(input, { photoDescription }),
        });
        const value = { ...parseJson(JudgeOutput, res.text), textOnly };
        return { value, output: res.text, model: res.model, usage: res.usage };
      },
    );
  };
  try {
    return await run(false);
  } catch (e) {
    const rejected = e instanceof ModelError && e.status !== null && e.status >= 400 && e.status < 500;
    if (input.evidence.kind !== "photo" || !rejected) throw e;
    return run(true);
  }
}
