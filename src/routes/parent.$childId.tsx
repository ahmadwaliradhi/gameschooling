import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChildForm } from "#/components/child-form";
import { ModelLog } from "#/components/model-log";
import { ProofView, fileUrl } from "#/components/proof-view";
import { cn } from "@/lib/utils";
import {
  decideFn,
  deleteQuestFn,
  getParentChild,
  giveRewardFn,
  removeChildFn,
  savePlanFn,
  updateChildFn,
} from "#/server/fns";

export const Route = createFileRoute("/parent/$childId")({
  loader: ({ params }) => getParentChild({ data: { childId: params.childId } }),
  component: ChildPage,
});

type View = Awaited<ReturnType<typeof getParentChild>>;
type Quest = View["quests"][number];

function ChildPage() {
  const view = Route.useLoaderData();
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex items-baseline gap-3">
        <button className="text-2xl font-semibold tracking-tight" onClick={() => setEditing(true)}>
          {view.child.nickname}
        </button>
        <span className="ml-auto text-2xl font-semibold tabular-nums">{view.points}</span>
      </header>
      <PlanNote key={view.child.id} childId={view.child.id} initial={view.plan} />
      <MakeQuests childId={view.child.id} />
      <section className="flex flex-col divide-y rounded-lg border">
        {view.quests.map((q) => (
          <QuestRow key={q.id} quest={q} />
        ))}
      </section>
      {view.rewards.length > 0 && <Rewards view={view} />}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{view.child.nickname}</DialogTitle>
          </DialogHeader>
          <ChildForm
            initial={view.child}
            submitLabel="Save"
            onSubmit={async (child) => {
              await updateChildFn({ data: { childId: view.child.id, ...child } });
              setEditing(false);
              await router.invalidate();
            }}
          />
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm(`Remove ${view.child.nickname} and everything they did?`)) return;
              await removeChildFn({ data: { childId: view.child.id } });
              setEditing(false);
              await router.invalidate();
              await navigate({ to: "/parent" });
            }}
          >
            Remove
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Autosaves as the Parent types.
function PlanNote(props: { childId: string; initial: string }) {
  const [text, setText] = useState(props.initial);
  const saved = useRef(props.initial);
  useEffect(() => {
    if (text === saved.current) return;
    const timer = setTimeout(() => {
      saved.current = text;
      void savePlanFn({ data: { childId: props.childId, text } });
    }, 600);
    return () => clearTimeout(timer);
  }, [text, props.childId]);
  return (
    <Textarea
      aria-label="Plan"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== saved.current) {
          saved.current = text;
          void savePlanFn({ data: { childId: props.childId, text } });
        }
      }}
      className="min-h-56 resize-y border-none bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
    />
  );
}

function MakeQuests(props: { childId: string }) {
  const router = useRouter();
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Button
        className="self-start"
        disabled={running}
        onClick={async () => {
          setRunning(true);
          setLines([]);
          try {
            const res = await fetch("/api/make-quests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ childId: props.childId }),
            });
            const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = "";
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += value;
              const parts = buffer.split("\n");
              buffer = parts.pop() ?? "";
              if (parts.length) {
                setLines((l) => [...l, ...parts]);
                if (parts.some((p) => p.startsWith("Wrote") || p.startsWith("Drew")))
                  void router.invalidate();
              }
            }
          } catch {
            setLines((l) => [...l, "Connection lost"]);
          } finally {
            setRunning(false);
            await router.invalidate();
          }
        }}
      >
        Make quests
      </Button>
      {lines.length > 0 && (
        <ol className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          {lines.map((l, i) => (
            <li key={i} className={cn(i === lines.length - 1 && running && "animate-pulse")}>
              {l}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const OUTCOME: Record<string, string> = {
  accepted: "Accepted",
  not_yet: "Not yet",
  needs_parent: "Needs you",
};

function Cover(props: { quest: Pick<Quest, "coverKey" | "coverColor" | "title">; className?: string }) {
  return props.quest.coverKey ? (
    <img
      src={fileUrl(props.quest.coverKey)}
      alt=""
      className={cn("rounded-md object-cover", props.className)}
    />
  ) : (
    <div className={cn("rounded-md", props.className)} style={{ background: props.quest.coverColor }} />
  );
}

function QuestRow(props: { quest: Quest }) {
  const q = props.quest;
  const router = useRouter();
  const [open, setOpen] = useState(q.verdict?.outcome === "needs_parent");
  const outcome = q.verdict ? OUTCOME[q.verdict.outcome] : q.status === "done" ? "Done" : "";
  return (
    <div className="flex flex-col">
      <button
        className="flex items-center gap-3 p-3 text-left hover:bg-accent/50"
        onClick={() => setOpen(!open)}
      >
        <Cover quest={q} className="size-10 shrink-0" />
        <span className="flex-1 font-medium">{q.title}</span>
        <span
          className={cn(
            "text-sm",
            q.verdict?.outcome === "needs_parent" ? "font-medium" : "text-muted-foreground",
          )}
        >
          {q.verdict && q.verdict.decidedBy !== "models" && q.verdict.modelOutcome !== q.verdict.outcome && (
            <s className="mr-2" title={new Date(q.verdict.decidedAt).toLocaleString()}>
              {OUTCOME[q.verdict.modelOutcome]}
            </s>
          )}
          {outcome}
        </span>
        <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{q.points}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-3 pt-1 pb-4 md:pl-16">
          <p className="text-sm">{q.readAloud}</p>
          {q.verdict ? (
            <>
              <ProofView proof={q.verdict.proof} sam={q.verdict.sam} />
              <ul className="flex flex-col gap-1 text-sm">
                {q.verdict.judges.map((j) => (
                  <li key={j.model}>
                    <span className="font-mono text-xs text-muted-foreground">{j.model}</span> {j.decision}{" "}
                    {Math.round(j.confidence * 100)}%{j.textOnly ? " (text only)" : ""} · {j.reason}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                {(["accept", "reject"] as const).map((choice) => (
                  <Button
                    key={choice}
                    variant={
                      (choice === "accept") === (q.verdict!.outcome === "accepted") &&
                      q.verdict!.outcome !== "needs_parent"
                        ? "default"
                        : "outline"
                    }
                    onClick={async () => {
                      await decideFn({ data: { verdictId: q.verdict!.id, choice } });
                      await router.invalidate();
                    }}
                  >
                    {choice === "accept" ? "Accept" : "Reject"}
                  </Button>
                ))}
              </div>
              <ModelLog of={{ verdictId: q.verdict.id }} />
            </>
          ) : null}
          <ModelLog of={{ questId: q.id }} />
          <Button
            variant="ghost"
            className="self-start text-destructive"
            onClick={async () => {
              await deleteQuestFn({ data: { questId: q.id } });
              await router.invalidate();
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

function Rewards(props: { view: View }) {
  const router = useRouter();
  return (
    <section className="flex flex-col divide-y rounded-lg border">
      {props.view.rewards.map((r) => (
        <div key={r.id} className="flex items-center gap-3 p-3">
          <span className="flex-1">{r.name}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{r.price}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={props.view.points < r.price}
            onClick={async () => {
              await giveRewardFn({ data: { childId: props.view.child.id, rewardId: r.id } });
              await router.invalidate();
            }}
          >
            Give
          </Button>
        </div>
      ))}
    </section>
  );
}
