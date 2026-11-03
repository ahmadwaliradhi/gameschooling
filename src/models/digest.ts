import { z } from "zod";
import { MODELS } from "./ids";
import { jsonSchema } from "./json";
import { parsed, recorded, type CallContext } from "./log";

// Digest: Muse Wonder reads a Family's week and writes the Parents a short summary per Child.

const DigestOutput = z.strictObject({
  children: z.array(
    z.strictObject({
      child_id: z.string(),
      learned: z.string(),
      struggled: z.string(),
      verdict_ids: z.array(z.string()),
    }),
  ),
});
export type DigestOutput = z.infer<typeof DigestOutput>;

export type WeekOfChild = {
  childId: string;
  age: number;
  quests: { title: string; answer: string; verdictId: string; outcome: string; reasons: string[] }[];
};

const SYSTEM = `You write a weekly summary for parents, one entry per child, from that week's learning Quests and Verdicts.
Children are named by id only; use the id as given.
learned: two or three sentences on what the child learned or practised, with patterns across the week.
struggled: one or two sentences on where they struggled and what the parent might change in the Plan; "" if nothing.
verdict_ids: the ids of the Verdicts your entry is based on, so the parent can check them.
Be warm, concrete and short. Never invent Quests that are not listed.`;

export async function writeDigestText(
  ctx: CallContext,
  input: { week: string; children: WeekOfChild[] },
): Promise<DigestOutput> {
  const body = input.children
    .map(
      (c) =>
        `Child ${c.childId} (age ${c.age}):\n${c.quests
          .map(
            (q) =>
              `- ${q.title} (expected: ${q.answer}); Verdict ${q.verdictId}: ${q.outcome}; ${q.reasons.join(" / ")}`,
          )
          .join("\n")}`,
    )
    .join("\n\n");
  return recorded(
    ctx,
    {
      agent: "digest",
      model: MODELS.wonder,
      endpoint: "meta /v1/responses",
      inputSummary: `week of ${input.week}, ${input.children.length} children, ${input.children.reduce((n, c) => n + c.quests.length, 0)} Verdicts`,
    },
    async () =>
      parsed(
        DigestOutput,
        await ctx.client.respond({
          model: MODELS.wonder,
          effort: "medium",
          schema: jsonSchema("weekly_digest", DigestOutput),
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Week starting ${input.week}\n\n${body}` },
          ],
        }),
      ),
  );
}
