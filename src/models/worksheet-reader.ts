import { z } from "zod";
import { MODELS } from "./ids";
import { jsonSchema } from "./json";
import { parsed, recorded, type CallContext } from "./log";

// Worksheet reader: Muse Spark 1.3 finds each answer on a photo of a worksheet, as pixel boxes.

const ReaderOutput = z.strictObject({
  answers: z.array(
    z.strictObject({
      question: z.string(),
      expected: z.string(),
      // What the child wrote, as read; "" when unreadable.
      reading: z.string(),
      legible: z.boolean(),
      x1: z.number(),
      y1: z.number(),
      x2: z.number(),
      y2: z.number(),
    }),
  ),
});
export type FoundAnswer = z.infer<typeof ReaderOutput>["answers"][number];

// SAM 3.1 takes at most 16 prompted objects.
export const MAX_ANSWERS = 16;

const SYSTEM = `You read a photo of a child's paper worksheet for a learning Quest.
Find each question the child answered (at most ${MAX_ANSWERS}). For each one give:
- question: the question as printed, short.
- expected: the right answer, from the Quest's expected answer or your own knowledge.
- reading: exactly what the child wrote, or "" if you cannot read it.
- legible: false if the handwriting is unclear; never guess.
- x1, y1, x2, y2: a pixel box around the child's written answer only, in the image's own size.`;

export async function readWorksheet(
  ctx: CallContext,
  input: { imageUrl: string; width: number; height: number; age: number; readAloud: string; answer: string },
): Promise<FoundAnswer[]> {
  const found = await recorded(
    ctx,
    {
      agent: "worksheet_reader",
      model: MODELS.spark,
      endpoint: "meta /v1/chat/completions",
      inputSummary: `worksheet photo ${input.width}×${input.height}, age ${input.age}`,
    },
    async () => {
      const res = await ctx.client.chat({
        provider: "meta",
        model: MODELS.spark,
        effort: "medium",
        schema: jsonSchema("worksheet_answers", ReaderOutput),
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Child's age: ${input.age}\nQuest: ${input.readAloud}\nExpected answers: ${input.answer}\nImage size: ${input.width}×${input.height} pixels`,
              },
              { type: "image", url: input.imageUrl },
            ],
          },
        ],
      });
      return parsed(ReaderOutput, res);
    },
  );
  return found.answers.slice(0, MAX_ANSWERS);
}
