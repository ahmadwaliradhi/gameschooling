import { useEffect, useRef } from "react";
import type { AnswerBox } from "#/db/schema";
import { fileUrl } from "./proof-view";

// Runs in the browser: draws one worksheet answer, cut from the photo by its box.
export function AnswerCrop(props: { photoKey: string; box: AnswerBox }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { x1, y1, x2, y2 } = props.box;
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const img = new Image();
    img.onload = () => {
      c.width = Math.max(1, x2 - x1);
      c.height = Math.max(1, y2 - y1);
      c.getContext("2d")!.drawImage(img, x1, y1, c.width, c.height, 0, 0, c.width, c.height);
    };
    img.src = fileUrl(props.photoKey);
  }, [props.photoKey, x1, y1, x2, y2]);
  return <canvas ref={canvas} className="max-h-24 max-w-48 rounded border bg-white" />;
}
