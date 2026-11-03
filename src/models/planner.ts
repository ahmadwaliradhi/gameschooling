import { z } from "zod";
import { jsonSchema } from "./json";
import { parsed, recorded, type CallContext } from "./log";

// Planner: Muse Wonder turns a Plan into Quest briefs and reads the Rewards out of it.

const Brief = z.strictObject({
  topic: z.string(),
  proof_kind: z.enum(["photo", "voice", "text"]),
  look_for: z.array(z.strictObject({ phrase: z.string(), count: z.number().int() })),
  answer: z.string(),
  recitation: z.boolean(),
  points: z.number().int(),
});
const PlannerOutput = z.strictObject({
  quests: z.array(Brief),
  rewards: z.array(z.strictObject({ name: z.string(), price: z.number().int() })),
});
export type Brief = z.infer<typeof Brief>;
export type PlannerOutput = z.infer<typeof PlannerOutput>;

export type PlannerInput = {
  planText: string;
  age: number;
  recent: { title: string; outcome: string | null }[];
};

const SYSTEM = `You plan learning Quests for one child, written by their parent in a Plan note.
Return about five Quests the child can do this week at home, each provable with one Proof:
- "photo": the child photographs something they found or made. Fill look_for with short concrete noun phrases (one object each, e.g. "red leaf") and how many must appear.
- "voice": the child answers out loud.
- "text": the child types (only for children aged 8 or more).
answer is the expected answer or a short rubric. Set recitation true only for Quests about reciting or pronouncing.
points is 5 to 20 by effort.
Follow everything the Plan says, including its language and anything it says to avoid.
Read every Reward the Plan lists with its Points price (for example "ice cream = 100") into rewards; return [] if none.`;

export async function plan(
  ctx: CallContext,
  input: PlannerInput,
  models: { primary: string; fallback: string },
): Promise<PlannerOutput> {
  const messages = [
    { role: "system" as const, content: SYSTEM },
    {
      role: "user" as const,
      content: `Child's age: ${input.age}\n\nPlan:\n${input.planText}\n\nRecent Quests:\n${
        input.recent.map((q) => `- ${q.title}: ${q.outcome ?? "not tried"}`).join("\n") || "none"
      }`,
    },
  ];
  const schema = jsonSchema("quest_plan", PlannerOutput);
  const run = (model: string) =>
    recorded(
      ctx,
      {
        agent: "planner",
        model,
        endpoint: "meta /v1/responses",
        inputSummary: `age ${input.age}, plan ${input.planText.length} chars, ${input.recent.length} recent Quests`,
      },
      async () =>
        parsed(PlannerOutput, await ctx.client.respond({ model, messages, effort: "high", schema })),
    );
  try {
    return await run(models.primary);
  } catch (e) {
    if (models.fallback === models.primary) throw e;
    return run(models.fallback);
  }
}
