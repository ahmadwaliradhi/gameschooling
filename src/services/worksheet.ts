import type { answerVerdicts, quests, SamFinding } from "#/db/schema";
import type { Outcome } from "#/domain/verdict";
import type { CallContext } from "#/models/log";
import { segmentBoxes } from "#/models/segmenter";
import { readWorksheet } from "#/models/worksheet-reader";
import { judgePair } from "./judge-pair";

export type AnswerRow = Omit<typeof answerVerdicts.$inferInsert, "familyId" | "verdictId">;

// Worksheet Proof: Muse Spark finds the answers, SAM 3.1 box prompts crop each one, and each answer
// gets its own two-model Verdict. Answers the reader could not read go to the Parent unjudged.
// The Worker only waits on models: crops are drawn in the Parent's browser from the boxes.
export async function judgeWorksheet(
  ctx: CallContext,
  input: {
    imageUrl: string;
    width: number;
    height: number;
    age: number;
    quest: typeof quests.$inferSelect;
  },
): Promise<{ answers: AnswerRow[]; sam: SamFinding[] }> {
  const { imageUrl, width, height, age, quest } = input;
  const found = await readWorksheet(ctx, {
    imageUrl,
    width,
    height,
    age,
    readAloud: quest.readAloud,
    answer: quest.answer,
  }).catch(() => []);
  if (found.length === 0) return { answers: [], sam: [] };

  let boxes = found.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }));
  let sam: SamFinding[] = [];
  try {
    const refined = await segmentBoxes(ctx, { boxes, width, height, imageUrl });
    boxes = refined.boxes;
    sam = [{ phrase: "answers", wanted: found.length, found: found.length, raw: refined.raw }];
  } catch {
    // The reader's boxes stand.
  }

  const now = new Date();
  const answers = await Promise.all(
    found.map(async (a, position): Promise<AnswerRow> => {
      const box = boxes[position]!;
      const { judges, outcome } = a.legible
        ? await judgePair(
            ctx,
            {
              age,
              readAloud: quest.readAloud,
              answer: quest.answer,
              lookFor: [],
              evidence: {
                kind: "worksheet",
                imageUrl,
                width,
                height,
                box,
                question: a.question,
                expected: a.expected,
                reading: a.reading,
              },
            },
            quest.recitation,
          )
        : { judges: [], outcome: "needs_parent" as Outcome };
      return {
        position,
        question: a.question,
        reading: a.legible ? a.reading : "",
        box,
        judges,
        modelOutcome: outcome,
        outcome,
        decidedBy: "models",
        decidedAt: now,
      };
    }),
  );
  return { answers, sam };
}
