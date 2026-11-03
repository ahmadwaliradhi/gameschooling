import { z } from "zod";
import type { Brief } from "./planner";
import { MODELS } from "./ids";
import { jsonSchema, parseJson } from "./json";
import { recorded, type CallContext } from "./log";

// Writer: Muse Spark 1.3 writes one Quest from one brief.

const QuestDraft = z.strictObject({
  title: z.string(),
  read_aloud: z.string(),
  cover_prompt: z.string(),
  look_for: z.array(z.strictObject({ phrase: z.string(), count: z.number().int() })),
  answer: z.string(),
});
export type QuestDraft = z.infer<typeof QuestDraft>;

const SYSTEM = `You write one learning Quest for a child, to be read aloud to them.
- title: 2 to 5 words.
- read_aloud: what the child hears, warm and short (2 to 4 sentences), in the Plan's language. Tell them exactly what Proof to give.
- cover_prompt: an English prompt for a square cover illustration: soft flat storybook style, no text, no letters, no people's faces.
- look_for and answer: refine the brief's; keep look_for phrases short concrete nouns SAM can find in a photo.
Child safety: nothing scary, violent, unsafe to do without an adult, or about strangers. Respect everything the Plan says to avoid.`;

export async function writeQuest(
  ctx: CallContext,
  input: { brief: Brief; planText: string; age: number },
): Promise<QuestDraft> {
  return recorded(
    ctx,
    {
      agent: "writer",
      model: MODELS.spark,
      endpoint: "meta /v1/chat/completions",
      inputSummary: `brief "${input.brief.topic}" (${input.brief.proof_kind}), age ${input.age}`,
    },
    async () => {
      const res = await ctx.client.chat({
        provider: "meta",
        model: MODELS.spark,
        effort: "medium",
        schema: jsonSchema("quest", QuestDraft),
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Child's age: ${input.age}\n\nPlan:\n${input.planText}\n\nBrief:\n${JSON.stringify(input.brief)}`,
          },
        ],
      });
      return {
        value: parseJson(QuestDraft, res.text),
        output: res.text,
        model: res.model,
        usage: res.usage,
      };
    },
  );
}
