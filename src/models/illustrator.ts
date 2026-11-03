import { MODELS } from "./ids";
import { recorded, type CallContext } from "./log";

// Illustrator: Muse Image draws one Quest cover.

export async function drawCover(
  ctx: CallContext,
  prompt: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  return recorded(
    ctx,
    {
      agent: "illustrator",
      model: MODELS.image,
      endpoint: "meta /v1/images/generations",
      inputSummary: prompt,
    },
    async () => {
      const image = await ctx.client.image({ model: MODELS.image, prompt });
      return { value: image, output: `${image.contentType}, ${image.bytes.byteLength} bytes`, images: 1 };
    },
  );
}
