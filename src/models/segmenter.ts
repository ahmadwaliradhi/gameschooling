import { MODELS } from "./ids";
import { recorded, type CallContext } from "./log";

// Segmenter: SAM 3.1 finds one noun phrase in a photo. An empty result means nothing was found.

export function countObjects(raw: string): number {
  return raw.match(/<\|box;/g)?.length ?? 0;
}

export async function segment(
  ctx: CallContext,
  input: { phrase: string; imageUrl: string },
): Promise<{ raw: string; found: number }> {
  return recorded(
    ctx,
    {
      agent: "segmenter",
      model: MODELS.sam,
      endpoint: "meta /v1/responses",
      inputSummary: `"${input.phrase}" in photo`,
    },
    async () => {
      const { raw } = await ctx.client.segment({ model: MODELS.sam, ...input });
      const found = countObjects(raw);
      return { value: { raw, found }, output: `${found} found`, images: 1 };
    },
  );
}

type Box = { x1: number; y1: number; x2: number; y2: number };

// SAM 3.1 box prompt: one numbered object per box; w and h are the photo's displayed size.
export function boxPrompt(boxes: readonly Box[], width: number, height: number): string {
  const r = Math.round;
  return `<0f>${boxes
    .map(
      (b, i) =>
        `${i + 1}<|box;x1=${r(b.x1)};y1=${r(b.y1)};x2=${r(b.x2)};y2=${r(b.y2)};w=${width};h=${height}|>`,
    )
    .join(",")}`;
}

// The boxes SAM returned, by object number.
export function parseBoxes(raw: string): Map<number, Box> {
  const boxes = new Map<number, Box>();
  for (const m of raw.matchAll(/(\d+)<\|box;([^|]*)\|>/g)) {
    const f = Object.fromEntries(m[2]!.split(";").map((kv) => kv.split("=") as [string, string]));
    boxes.set(Number(m[1]), { x1: Number(f.x1), y1: Number(f.y1), x2: Number(f.x2), y2: Number(f.y2) });
  }
  return boxes;
}

// Refines each box to a clean crop of the answer. A box SAM did not return keeps its original.
export async function segmentBoxes(
  ctx: CallContext,
  input: { boxes: Box[]; width: number; height: number; imageUrl: string },
): Promise<{ raw: string; boxes: Box[] }> {
  return recorded(
    ctx,
    {
      agent: "segmenter",
      model: MODELS.sam,
      endpoint: "meta /v1/responses",
      inputSummary: `${input.boxes.length} answer boxes in worksheet photo`,
    },
    async () => {
      const { raw } = await ctx.client.segment({
        model: MODELS.sam,
        phrase: boxPrompt(input.boxes, input.width, input.height),
        imageUrl: input.imageUrl,
      });
      const refined = parseBoxes(raw);
      const boxes = input.boxes.map((b, i) => refined.get(i + 1) ?? b);
      return { value: { raw, boxes }, output: `${refined.size} of ${input.boxes.length} refined`, images: 1 };
    },
  );
}
