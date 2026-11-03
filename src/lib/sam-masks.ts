import { decodeMaskToRaster, parseImageStream, recordsOfKind } from "@meta-sam/parser";

// Runs in the browser: decodes SAM 3.1's raw output and paints its masks onto a canvas.

async function* asEvents(raw: string) {
  const lane = { item_id: "sam", output_index: 0, content_index: 0 };
  yield { type: "response.output_text.delta", ...lane, delta: raw };
  yield { type: "response.output_text.done", ...lane, text: raw };
  yield { type: "response.completed", response: {} };
}

const COLORS = ["255, 204, 0", "52, 199, 89", "0, 122, 255", "255, 45, 85"];

export async function drawMasks(canvas: HTMLCanvasElement, raws: string[]) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const [i, raw] of raws.entries()) {
    if (!raw) continue;
    const result = await parseImageStream(asEvents(raw)).finalResult;
    for (const record of recordsOfKind(result.records, "mask")) {
      const { width, height } = record.mask;
      const raster = decodeMaskToRaster(record.mask);
      const image = ctx.createImageData(width, height);
      const [r, g, b] = COLORS[i % COLORS.length]!.split(",").map(Number);
      for (let p = 0; p < raster.length; p++) {
        if (!raster[p]) continue;
        image.data.set([r!, g!, b!, 120], p * 4);
      }
      const tile = new OffscreenCanvas(width, height);
      tile.getContext("2d")!.putImageData(image, 0, 0);
      const { left, top, right, bottom } = record.bounds;
      ctx.drawImage(tile, left, top, right - left, bottom - top);
    }
  }
}
