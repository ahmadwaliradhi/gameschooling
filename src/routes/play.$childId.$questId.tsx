import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fileUrl } from "#/components/proof-view";
import { resizeImage } from "#/lib/resize-image";
import { speak } from "#/lib/speak";
import { startRecording, type Recording } from "#/lib/wav-recorder";
import { chooseStakeFn, getQuestPlay } from "#/server/fns";

export const Route = createFileRoute("/play/$childId/$questId")({
  loader: ({ params }) => getQuestPlay({ data: { childId: params.childId, questId: params.questId } }),
  component: QuestPlay,
});

type State = "idle" | "recording" | "checking" | "accepted" | "not_yet" | "needs_parent" | "error";

function QuestPlay() {
  const data = Route.useLoaderData();
  const { childId } = Route.useParams();
  const router = useRouter();
  const initial: State =
    data?.verdict?.outcome === "needs_parent"
      ? "needs_parent"
      : data?.quest.status === "done"
        ? "accepted"
        : "idle";
  const [state, setState] = useState<State>(initial);
  const [text, setText] = useState("");
  const recording = useRef<Recording | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  if (!data) return null;
  const { quest, stakeOffers } = data;

  async function submit(form: FormData) {
    setState("checking");
    form.set("questId", quest.id);
    form.set("kind", quest.proofKind);
    try {
      const res = await fetch("/api/proof", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { outcome } = (await res.json()) as { outcome: State };
      setState(outcome);
      await router.invalidate();
    } catch {
      setState("error");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-4">
      <Link to="/play/$childId" params={{ childId }} className="self-start text-lg text-muted-foreground">
        Back
      </Link>
      <div
        className="aspect-square w-full overflow-hidden rounded-3xl"
        style={{ background: quest.coverColor }}
      >
        {quest.coverKey && <img src={fileUrl(quest.coverKey)} alt="" className="size-full object-cover" />}
      </div>
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-full text-xl"
        onClick={() => speak(quest.readAloud)}
      >
        Play
      </Button>

      {state === "idle" && stakeOffers.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          <p className="text-center text-lg">Take a challenge?</p>
          <div className="grid grid-cols-3 gap-2">
            {[null, ...stakeOffers].map((o) => {
              const multiplier = o?.multiplier ?? null;
              return (
                <Button
                  key={multiplier ?? "none"}
                  variant={quest.stakeMultiplier === multiplier ? "default" : "outline"}
                  className="h-auto flex-col rounded-2xl py-3 text-lg"
                  onClick={async () => {
                    await chooseStakeFn({ data: { childId, questId: quest.id, multiplier } });
                    await router.invalidate();
                  }}
                >
                  {o ? (
                    <>
                      <span>{o.multiplier}×</span>
                      <span className="text-sm">+{o.bonus} if right, none if not</span>
                    </>
                  ) : (
                    <span>No thanks</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {(state === "idle" || state === "error" || state === "recording") && (
        <>
          {(quest.proofKind === "photo" || quest.proofKind === "worksheet") && (
            <>
              <input
                ref={camera}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const form = new FormData();
                  const photo = await resizeImage(file);
                  form.set("file", photo, "proof.jpg");
                  if (quest.proofKind === "worksheet") {
                    // The photo's own size, for SAM box prompts.
                    const bitmap = await createImageBitmap(photo);
                    form.set("width", String(bitmap.width));
                    form.set("height", String(bitmap.height));
                    bitmap.close();
                  }
                  await submit(form);
                }}
              />
              <BigButton onClick={() => camera.current?.click()}>Camera</BigButton>
            </>
          )}
          {quest.proofKind === "voice" && (
            <BigButton
              active={state === "recording"}
              onClick={async () => {
                if (!recording.current) {
                  recording.current = await startRecording();
                  setState("recording");
                  return;
                }
                const wav = await recording.current.stop();
                recording.current = null;
                const form = new FormData();
                form.set("file", wav, "proof.wav");
                await submit(form);
              }}
            >
              {state === "recording" ? "Stop" : "Record"}
            </BigButton>
          )}
          {quest.proofKind === "text" && (
            <form
              className="flex w-full flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                const form = new FormData();
                form.set("text", text);
                await submit(form);
              }}
            >
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-32 text-xl" />
              <BigButton type="submit">Send</BigButton>
            </form>
          )}
          {state === "error" && <p className="text-lg text-destructive">Try again</p>}
        </>
      )}

      {state === "checking" && <p className="animate-pulse text-2xl">Checking</p>}
      {state === "accepted" && (
        <p className="text-4xl font-semibold">
          {quest.proofKind === "worksheet" ? "Well done!" : `+${quest.points}`}
        </p>
      )}
      {state === "needs_parent" && <p className="text-2xl">Waiting for Mum or Dad</p>}
      {state === "not_yet" && <BigButton onClick={() => setState("idle")}>Try again</BigButton>}
    </main>
  );
}

function BigButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "submit";
  active?: boolean;
}) {
  return (
    <Button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={`h-24 w-full rounded-3xl text-3xl ${props.active ? "animate-pulse bg-destructive text-white" : ""}`}
    >
      {props.children}
    </Button>
  );
}
