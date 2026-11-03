import { z } from "zod";
import { MODELS } from "./ids";
import { jsonSchema } from "./json";
import { parsed, recorded, type CallContext } from "./log";

// Guardian: a separate Muse Spark 1.3 call checks every Quest before a Child can see it.

const GuardianOutput = z.strictObject({
  safe: z.boolean(),
  // Why it is not safe, in one short line a parent can read; "" when safe.
  reason: z.string(),
});
export type GuardianOutput = z.infer<typeof GuardianOutput>;

const SYSTEM = `You check one learning Quest before a child sees it. You did not write it.
Decide safe=false if the Quest text or its cover prompt has anything scary, violent, sexual, hateful, unsafe for the child to do without an adult, about strangers, or not suitable for the child's age.
Also decide safe=false if it breaks anything the parent's Plan says to avoid (for example "no fantasy creatures").
reason is one short line a parent can read; "" when safe.`;

export async function guardQuest(
  ctx: CallContext,
  input: { title: string; readAloud: string; coverPrompt: string; age: number; planText: string },
): Promise<GuardianOutput> {
  return recorded(
    ctx,
    {
      agent: "guardian",
      model: MODELS.spark,
      endpoint: "meta /v1/chat/completions",
      inputSummary: `"${input.title}", age ${input.age}, plan ${input.planText.length} chars`,
    },
    async () => {
      const res = await ctx.client.chat({
        provider: "meta",
        model: MODELS.spark,
        effort: "low",
        schema: jsonSchema("guardian_check", GuardianOutput),
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Child's age: ${input.age}\n\nPlan:\n${input.planText}\n\nQuest title: ${input.title}\nRead aloud: ${input.readAloud}\nCover prompt: ${input.coverPrompt}`,
          },
        ],
      });
      return parsed(GuardianOutput, res);
    },
  );
}
