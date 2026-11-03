import { MODELS } from "./ids";
import { parseJson } from "./json";
import { JudgeOutput, judgeMessages, judgeSchema, summarize, type JudgeInput } from "./judging";
import { recorded, type CallContext } from "./log";

// Judge: Muse Spark 1.3 checks the Proof. Audio never goes here, only transcripts.

export async function judge(ctx: CallContext, input: JudgeInput): Promise<JudgeOutput> {
  return recorded(
    ctx,
    {
      agent: "judge",
      model: MODELS.spark,
      endpoint: "meta /v1/chat/completions",
      inputSummary: summarize(input),
    },
    async () => {
      const res = await ctx.client.chat({
        provider: "meta",
        model: MODELS.spark,
        effort: "medium",
        schema: judgeSchema,
        messages: judgeMessages(input),
      });
      return {
        value: parseJson(JudgeOutput, res.text),
        output: res.text,
        model: res.model,
        usage: res.usage,
      };
    },
  );
}
