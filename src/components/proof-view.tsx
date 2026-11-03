import { useEffect, useRef } from "react";
import type { SamFinding, TranscriptTurn } from "#/db/schema";
import { drawMasks } from "#/lib/sam-masks";

export function fileUrl(key: string) {
  return `/api/files/${key}`;
}

// A Child's Proof as the Parent sees it, with SAM 3.1 masks over photos.
export function ProofView(props: {
  proof: { kind: string; photoKey: string | null; transcript: TranscriptTurn[] | null; text: string | null };
  sam: SamFinding[] | null;
}) {
  const { proof } = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = image.current;
    const c = canvas.current;
    if (!img || !c || !props.sam?.length) return;
    const paint = () => {
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      void drawMasks(
        c,
        props.sam!.map((f) => f.raw),
      ).catch(() => undefined);
    };
    if (img.complete) paint();
    else img.addEventListener("load", paint, { once: true });
  }, [props.sam]);

  if (proof.kind === "photo" && proof.photoKey) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative w-fit max-w-full">
          <img ref={image} src={fileUrl(proof.photoKey)} alt="Proof" className="max-h-96 rounded-md" />
          <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" />
        </div>
        {props.sam && (
          <ul className="text-sm text-muted-foreground">
            {props.sam.map((f) => (
              <li key={f.phrase}>
                {f.phrase}: {f.found} of {f.wanted}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (proof.kind === "voice" && proof.transcript) {
    return (
      <div className="flex flex-col gap-1 text-sm">
        {proof.transcript.map((t, i) => (
          <p key={i}>
            <span className="mr-2 text-muted-foreground">{t.speaker ?? "?"}</span>
            {t.text}
          </p>
        ))}
      </div>
    );
  }
  return <p className="text-sm whitespace-pre-wrap">{proof.text}</p>;
}
