import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AnswerCrop } from "#/components/answer-crop";
import { ChildForm } from "#/components/child-form";
import { ModelLog } from "#/components/model-log";
import { ProofView, fileUrl } from "#/components/proof-view";
import { cn } from "@/lib/utils";
import {
  decideAnswerFn,
  decideFn,
  deleteQuestFn,
  getParentChild,
  giveRewardFn,
  recordConsequenceFn,
  removeChildFn,
  savePlanFn,
  setChildSettingsFn,
  setPinFn,
  updateChildFn,
  applyStarterPlanFn,
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
  // Bumped when a Starter Plan replaces the Plan, so the note shows the new text.
  const [planVersion, setPlanVersion] = useState(0);
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
      <PlanNote key={`${view.child.id}-${planVersion}`} childId={view.child.id} initial={view.plan} />
      <StarterPlans view={view} onUse={() => setPlanVersion((v) => v + 1)} />
      <MakeQuests childId={view.child.id} />
      <section className="flex flex-col divide-y rounded-lg border">
        {view.quests.map((q) => (
          <QuestRow key={q.id} quest={q} />
        ))}
      </section>
      {view.dropped.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {view.dropped.length} Quests dropped by the safety check
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {view.dropped.map((q) => (
              <li key={q.id}>
                <span className="font-medium">{q.title}</span> · {q.droppedReason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {view.rewards.length > 0 && <Rewards view={view} />}
      <Consequences view={view} />
      <PointsLog view={view} />
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
          <ChildSettings view={view} />
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
            <s
              className="mr-2"
              title={`${q.verdict.decidedByName ?? "A Parent"}, ${new Date(q.verdict.decidedAt).toLocaleString()}`}
            >
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
              {q.verdict.answers.length > 0 && q.verdict.proof.photoKey && (
                <WorksheetAnswers answers={q.verdict.answers} photoKey={q.verdict.proof.photoKey} />
              )}
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

type Answer = NonNullable<Quest["verdict"]>["answers"][number];

// Each worksheet answer: its crop, what the models read, their Verdict, and the Parent's say.
function WorksheetAnswers(props: { answers: Answer[]; photoKey: string }) {
  const router = useRouter();
  return (
    <ol className="flex flex-col gap-3">
      {props.answers.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-3 text-sm">
          <AnswerCrop photoKey={props.photoKey} box={a.box} />
          <div className="flex min-w-40 flex-1 flex-col">
            <span className="font-medium">{a.question}</span>
            <span className="text-muted-foreground">Read as: {a.reading || "could not read"}</span>
            {a.judges.map((j) => (
              <span key={j.model} className="text-xs text-muted-foreground">
                {j.model}: {j.decision} {Math.round(j.confidence * 100)}% · {j.reason}
              </span>
            ))}
          </div>
          <span className={a.outcome === "needs_parent" ? "font-medium" : "text-muted-foreground"}>
            {a.decidedByName && a.modelOutcome !== a.outcome && (
              <s className="mr-1" title={a.decidedByName}>
                {OUTCOME[a.modelOutcome]}
              </s>
            )}
            {OUTCOME[a.outcome]}
          </span>
          {(["accept", "reject"] as const).map((choice) => (
            <Button
              key={choice}
              size="sm"
              variant={
                a.outcome !== "needs_parent" && (choice === "accept") === (a.outcome === "accepted")
                  ? "default"
                  : "outline"
              }
              onClick={async () => {
                await decideAnswerFn({ data: { answerId: a.id, choice } });
                await router.invalidate();
              }}
            >
              {choice === "accept" ? "Accept" : "Reject"}
            </Button>
          ))}
        </li>
      ))}
    </ol>
  );
}

function StarterPlans(props: { view: View; onUse: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        Starter Plans
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Starter Plans</DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col divide-y">
            {props.view.starterPlans.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 font-medium">{p.name}</span>
                  <span className={cn("text-xs", p.fits ? "text-foreground" : "text-muted-foreground")}>
                    ages {p.minAge}–{p.maxAge}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">{p.text}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={async () => {
                    if (props.view.plan.trim() && !confirm("Replace the Plan with this Starter Plan?"))
                      return;
                    await applyStarterPlanFn({ data: { childId: props.view.child.id, starterId: p.id } });
                    await router.invalidate();
                    props.onUse();
                    setOpen(false);
                  }}
                >
                  Use
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Stakes, Sibling Board and PIN for one Child.
function ChildSettings(props: { view: View }) {
  const router = useRouter();
  const { child } = props.view;
  const [pin, setPin] = useState("");
  const save = async (settings: { stakes?: boolean | null; siblingBoard?: boolean }) => {
    await setChildSettingsFn({ data: { childId: child.id, ...settings } });
    await router.invalidate();
  };
  return (
    <div className="flex flex-col gap-3 border-t pt-4 text-sm">
      <label className="flex items-center justify-between gap-2">
        Stakes
        <select
          className="rounded-md border bg-transparent px-2 py-1"
          value={child.stakes === null ? "default" : child.stakes ? "on" : "off"}
          onChange={(e) =>
            void save({ stakes: e.target.value === "default" ? null : e.target.value === "on" })
          }
        >
          <option value="default">By age (from 8)</option>
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-2">
        Sibling Board
        <input
          type="checkbox"
          checked={child.siblingBoard}
          onChange={(e) => void save({ siblingBoard: e.target.checked })}
        />
      </label>
      <form
        className="flex items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{4}$/.test(pin)) return;
          await setPinFn({ data: { childId: child.id, pin } });
          setPin("");
          await router.invalidate();
        }}
      >
        <span className="flex-1">PIN {child.hasPin ? "set" : "none"}</span>
        <Input
          aria-label="New PIN"
          placeholder="4 digits"
          inputMode="numeric"
          className="w-24"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <Button type="submit" size="sm" variant="outline" disabled={pin.length !== 4}>
          {child.hasPin ? "Reset" : "Set"}
        </Button>
        {child.hasPin && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={async () => {
              await setPinFn({ data: { childId: child.id, pin: null } });
              await router.invalidate();
            }}
          >
            Remove
          </Button>
        )}
      </form>
    </div>
  );
}

// Recorded by a Parent with a reason; never shown to Children and never touches Points.
function Consequences(props: { view: View }) {
  const router = useRouter();
  const [privilege, setPrivilege] = useState("");
  const [reason, setReason] = useState("");
  return (
    <details className="flex flex-col gap-3">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        Consequences ({props.view.consequences.length})
      </summary>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!privilege.trim() || !reason.trim()) return;
          await recordConsequenceFn({ data: { childId: props.view.child.id, privilege, reason } });
          setPrivilege("");
          setReason("");
          await router.invalidate();
        }}
      >
        <Input
          aria-label="Privilege"
          placeholder="Privilege you control, e.g. no tablet tonight"
          value={privilege}
          onChange={(e) => setPrivilege(e.target.value)}
        />
        <Input
          aria-label="Reason"
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="self-start"
          disabled={!privilege.trim() || !reason.trim()}
        >
          Record
        </Button>
      </form>
      <ul className="mt-3 flex flex-col gap-1 text-sm">
        {props.view.consequences.map((c) => (
          <li key={c.id}>
            <span className="font-medium">{c.privilege}</span> · {c.reason}
            <span className="text-muted-foreground">
              {" "}
              · {c.parentName}, {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

const POINTS_KIND: Record<string, string> = {
  earned: "Earned",
  overrule: "Overrule",
  reward_given: "Reward",
  stake_won: "Stake won",
  stake_lost: "Stake lost",
};

function PointsLog(props: { view: View }) {
  if (props.view.pointsLog.length === 0) return null;
  return (
    <details>
      <summary className="cursor-pointer text-sm text-muted-foreground">Points log</summary>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {props.view.pointsLog.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-1 pr-3 text-muted-foreground">
                {new Date(e.createdAt).toLocaleDateString()}
              </td>
              <td className="py-1 pr-3">
                {POINTS_KIND[e.kind]}
                {e.rewardName ? `: ${e.rewardName}` : ""}
              </td>
              <td className="py-1 text-right tabular-nums">
                {e.amount > 0 ? "+" : ""}
                {e.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
