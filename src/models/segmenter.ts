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
