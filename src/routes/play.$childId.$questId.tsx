import { Link, createFileRoute, isRedirect, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  Hourglass,
  Mic,
  PartyPopper,
  RotateCcw,
  Send,
  Square,
  Volume2,
} from "lucide-react";
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

type State =
  | "idle"
  | "recording"
  | "checking"
  | "accepted"
  | "not_yet"
  | "needs_parent"
  | "error"
  | "mic_error";

// Stops a forgotten Recording before it grows past the upload limit.
const MAX_RECORDING_MS = 3 * 60 * 1000;
const MIC_HELP = "Ask Mum or Dad to turn on the microphone";

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
  const [staking, setStaking] = useState(false);
  const [stakeError, setStakeError] = useState(false);
  const [paid, setPaid] = useState<number | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const recording = useRef<Recording | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const busy = useRef(false);
  const mounted = useRef(true);
  const camera = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    mounted.current = true;
    // Leaving mid-Recording turns the microphone off.
    return () => {
      mounted.current = false;
      clearTimeout(recordingTimer.current);
      const r = recording.current;
      recording.current = null;
      void r?.stop().catch(() => {});
    };
  }, []);

  // While waiting for the Parent, check now and then for their Verdict.
  useEffect(() => {
    if (state !== "needs_parent") return;
    const t = setInterval(() => void router.invalidate(), 15000);
    return () => clearInterval(t);
  }, [state, router]);

  useEffect(() => {
    if (!data) return;
    setState((s) =>
      s !== "needs_parent"
        ? s
        : data.quest.status === "done"
          ? "accepted"
          : data.verdict?.outcome === "not_yet"
            ? "not_yet"
            : s,
    );
  }, [data]);

  const backToGrid = () => void router.navigate({ to: "/play/$childId", params: { childId } });

  if (!data || data.quest.status === "deleted" || data.quest.status === "dropped") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-4 py-12">
        <p className="text-2xl font-semibold">This Quest is gone</p>
        <BigButton onClick={backToGrid}>
          <ChevronLeft className="size-10" /> Back
        </BigButton>
      </main>
    );
  }
  const { quest, stakeOffers } = data;

  async function submit(form: FormData) {
    setState("checking");
    form.set("questId", quest.id);
    form.set("kind", quest.proofKind);
    const bonus = stakeOffers.find((o) => o.multiplier === quest.stakeMultiplier)?.bonus ?? 0;
    try {
      const res = await fetch("/api/proof", { method: "POST", body: form });
      // These can never work on a retry, so send the Child where they can go on.
      if (res.status === 403) {
        await router.navigate({ to: "/play/$childId/pin", params: { childId } });
        return;
      }
      if (res.status === 401) {
        await router.navigate({ to: "/" });
        return;
      }
      if (res.status === 409) {
        setState("needs_parent");
        return;
      }
      if (res.status === 404) {
        backToGrid();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { outcome } = (await res.json()) as { outcome: State };
      if (outcome === "accepted") setPaid(quest.points + bonus);
      setState(outcome);
      await router.invalidate();
    } catch {
      setState("error");
    }
  }

  async function toggleRecording() {
    if (busy.current) return;
    busy.current = true;
    try {
      if (!recording.current) {
        let r: Recording;
        try {
          r = await startRecording();
        } catch {
          setState("mic_error");
          return;
        }
        if (!mounted.current) {
          void r.stop().catch(() => {});
          return;
        }
        recording.current = r;
        setState("recording");
        recordingTimer.current = setTimeout(() => void toggleRecording(), MAX_RECORDING_MS);
        return;
      }
      clearTimeout(recordingTimer.current);
      const r = recording.current;
      recording.current = null;
      setState("checking");
      const wav = await r.stop();
      const form = new FormData();
      form.set("file", wav, "proof.wav");
      await submit(form);
    } catch {
      setState("error");
    } finally {
      busy.current = false;
    }
  }

  async function chooseStake(multiplier: number | null) {
    if (staking) return;
    setStaking(true);
    setStakeError(false);
    try {
      await chooseStakeFn({ data: { childId, questId: quest.id, multiplier } });
      await router.invalidate();
    } catch (e) {
      if (isRedirect(e)) await router.navigate(e.options);
      // Stay on the challenge buttons so the Child can pick again.
      else setStakeError(true);
    } finally {
      setStaking(false);
    }
  }

  const tryAgainHint = state === "idle" && data.verdict?.outcome === "not_yet";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 p-4">
      <Link
        to="/play/$childId"
        params={{ childId }}
        className="flex items-center gap-1 self-start text-lg text-muted-foreground"
      >
        <ChevronLeft className="size-5" /> Back
      </Link>
      <div
        className="aspect-square w-full overflow-hidden rounded-3xl"
        style={{ background: quest.coverColor }}
      >
        {quest.coverKey && <img src={fileUrl(quest.coverKey)} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold">{quest.title}</h1>
        <p className="text-lg">{quest.readAloud}</p>
      </div>
      {canSpeak && (
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-full text-xl"
          onClick={() => speak(quest.readAloud)}
        >
          <Volume2 className="size-6" /> Listen
        </Button>
      )}

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
                  className="h-auto flex-col rounded-2xl py-3 text-lg whitespace-normal"
                  disabled={staking}
                  onClick={() => void chooseStake(multiplier)}
                >
                  {o ? (
                    <>
                      <span>{o.multiplier}×</span>
                      <span className="text-sm leading-tight">+{o.bonus} if right, none if not</span>
                    </>
                  ) : (
                    <span>No thanks</span>
                  )}
                </Button>
              );
            })}
          </div>
          {stakeError && (
            <p role="alert" className="text-center text-lg text-destructive">
              Try again
            </p>
          )}
        </div>
      )}

      {tryAgainHint && (
        <p className="flex items-center gap-2 text-xl font-semibold">
          <RotateCcw className="size-6" /> Try again
        </p>
      )}

      {(state === "idle" || state === "error" || state === "recording" || state === "mic_error") && (
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
                  // Let the same photo be picked again after a failure.
                  e.target.value = "";
                  if (!file) return;
                  setState("checking");
                  try {
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
                  } catch {
                    setState("error");
                  }
                }}
              />
              <BigButton onClick={() => camera.current?.click()}>
                <Camera className="size-10" /> Camera
              </BigButton>
            </>
          )}
          {quest.proofKind === "voice" && (
            <BigButton active={state === "recording"} onClick={() => void toggleRecording()}>
              {state === "recording" ? (
                <>
                  <Square className="size-10" /> Stop
                </>
              ) : (
                <>
                  <Mic className="size-10" /> Record
                </>
              )}
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
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Your answer"
                placeholder="Type your answer"
                className="min-h-32 text-xl"
              />
              <BigButton type="submit">
                <Send className="size-10" /> Send
              </BigButton>
            </form>
          )}
          {state === "error" && (
            <p role="alert" className="flex items-center gap-2 text-lg text-destructive">
              <RotateCcw className="size-5" /> Try again
            </p>
          )}
          {state === "mic_error" && (
            <div className="flex w-full flex-col items-center gap-3">
              <p role="alert" className="text-center text-lg text-destructive">
                {MIC_HELP}
              </p>
              {canSpeak && (
                <Button size="lg" variant="outline" onClick={() => speak(MIC_HELP)}>
                  <Volume2 /> Listen
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {state === "checking" && (
        <p role="status" className="animate-pulse text-2xl">
          Checking
        </p>
      )}
      {state === "accepted" && (
        <>
          <PartyPopper className="size-20 text-primary" />
          <p className="text-4xl font-semibold">
            {quest.proofKind === "worksheet" ? "Well done!" : `+${paid ?? quest.points}`}
          </p>
          <BigButton onClick={backToGrid}>
            <ChevronLeft className="size-10" /> More Quests
          </BigButton>
        </>
      )}
      {state === "needs_parent" && (
        <>
          <Hourglass className="size-16 text-muted-foreground" />
          <p className="text-2xl">Waiting for Mum or Dad</p>
          <BigButton onClick={backToGrid}>
            <ChevronLeft className="size-10" /> More Quests
          </BigButton>
        </>
      )}
      {state === "not_yet" && (
        <BigButton onClick={() => setState("idle")}>
          <RotateCcw className="size-10" /> Try again
        </BigButton>
      )}
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
