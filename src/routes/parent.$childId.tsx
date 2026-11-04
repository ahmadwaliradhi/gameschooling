import { createFileRoute, getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AnswerCrop } from "#/components/answer-crop";
import { ChildForm } from "#/components/child-form";
import { LocalDate } from "#/components/local-date";
import { ModelLog } from "#/components/model-log";
import { ProofView, fileUrl } from "#/components/proof-view";
import { cn } from "@/lib/utils";
import { runs, useDraft, useRun } from "#/lib/make-quests-runs";
import {
  decideAnswerFn,
  decideFn,
  deleteQuestFn,
  getParentChild,
  giveRewardFn,
  recordConsequenceFn,
  removeChildFn,
  setChildSettingsFn,
  setPinFn,
  updateChildFn,
} from "#/server/fns";

export const Route = createFileRoute("/parent/$childId")({
  loader: ({ params }) => getParentChild({ data: { childId: params.childId } }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.child.nickname ?? "Child"} · GameSchooling` }],
  }),
  component: ChildPage,
});

type View = Awaited<ReturnType<typeof getParentChild>>;
type Quest = View["quests"][number];

function ChildPage() {
  const view = Route.useLoaderData();
  const [editing, setEditing] = useState(false);
  const [nameStatus, setNameStatus] = useState<"saved" | "error" | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{view.child.nickname}</h1>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Settings /> Settings
        </Button>
        <span className="ml-auto flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums">{view.points}</span>
          <span className="text-sm text-muted-foreground">Points</span>
        </span>
      </header>
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-medium">Plan</h2>
          <p className="text-sm text-muted-foreground">
            What Quests should cover. Make quests reads this every time.
          </p>
        </div>
        <PlanForm view={view} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Quests</h2>
        {view.quests.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No Quests yet. Write a Plan above, then press Make quests.
          </p>
        ) : (
          <div className="flex flex-col divide-y rounded-lg border">
            {view.quests.map((q) => (
              <QuestRow key={q.id} quest={q} />
            ))}
          </div>
        )}
      </section>
      {view.dropped.length > 0 && <DroppedQuests dropped={view.dropped} />}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-medium">Rewards</h2>
          <p className="text-sm text-muted-foreground">
            Read from the Plan when you press Make quests. Give one to spend its Points.
          </p>
        </div>
        {view.rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Rewards yet. Add them to the Plan with a price, then press Make quests.
          </p>
        ) : (
          <Rewards view={view} />
        )}
      </section>
      <Consequences view={view} />
      <PointsLog view={view} />
      <Dialog
        open={editing}
        onOpenChange={(o) => {
          setEditing(o);
          setNameStatus(null);
          setRemoveError(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{view.child.nickname}'s settings</DialogTitle>
          </DialogHeader>
          <ChildForm
            initial={view.child}
            submitLabel="Save name and age"
            onSubmit={async (child) => {
              setNameStatus(null);
              try {
                await updateChildFn({ data: { childId: view.child.id, ...child } });
                setNameStatus("saved");
                await router.invalidate();
              } catch {
                setNameStatus("error");
              }
            }}
          />
          <p
            aria-live="polite"
            className={cn(
              "text-xs empty:hidden",
              nameStatus && "-mt-2",
              nameStatus === "error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {nameStatus === "error" ? "Could not save. Try again." : nameStatus === "saved" ? "Saved" : ""}
          </p>
          <ChildSettings view={view} />
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={removing}
            onClick={async () => {
              if (!confirm(`Remove ${view.child.nickname} and everything they did?`)) return;
              setRemoving(true);
              setRemoveError(null);
              try {
                await removeChildFn({ data: { childId: view.child.id } });
                setEditing(false);
                await navigate({ to: "/parent" });
                void router.invalidate();
              } catch {
                setRemoveError("Could not remove. Try again.");
              } finally {
                setRemoving(false);
              }
            }}
          >
            {removing ? "Removing…" : `Remove ${view.child.nickname}`}
          </Button>
          {removeError && (
            <p role="alert" className="text-xs text-destructive">
              {removeError}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PLAN_PLACEHOLDER = `What to learn, e.g. counting to 20, letters A to E
Language, e.g. English and Bahasa Indonesia
What to avoid, e.g. no dragons or fairies
Rewards with prices, e.g. ice cream = 100, park trip = 40`;

// The Plan box and Make quests are one form: pressing Make quests saves the box text
// and makes Quests in one request. Typing and Starter Plans only change the box. The
// box text and the run live in a store per Child, so switching Children keeps both.
function PlanForm(props: { view: View }) {
  const { view } = props;
  const childId = view.child.id;
  const router = useRouter();
  const navigate = useNavigate();
  const draft = useDraft(childId);
  const run = useRun(childId);
  const text = draft ?? view.plan;
  const setText = (next: string) => runs.setDraft(childId, next === view.plan ? undefined : next);
  const unsaved = draft !== undefined;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void runs.start(childId, text, {
          progress: () => router.invalidate(),
          signedOut: () => void navigate({ to: "/" }),
        });
      }}
    >
      <Textarea
        aria-label="Plan"
        placeholder={PLAN_PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-48 resize-y p-4 text-base leading-relaxed md:text-base"
      />
      <p aria-live="polite" className="self-end text-xs text-muted-foreground">
        {unsaved ? "Not saved yet. Make quests saves it." : "Saved"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={run.running || !text.trim()}
          title={text.trim() ? undefined : "Write a Plan first"}
        >
          {run.running ? "Making quests…" : "Make quests"}
        </Button>
        <StarterPlans view={view} text={text} onUse={setText} />
      </div>
      {run.lines.length > 0 && (
        <ol aria-hidden className="flex flex-col gap-0.5 text-sm text-muted-foreground">
          {run.lines.map((l, i) => (
            <li
              key={i}
              className={cn(
                i === run.lines.length - 1 && run.running && "animate-pulse",
                (l.startsWith("Could not") ||
                  l === "Connection lost" ||
                  l.startsWith("You are signed out")) &&
                  "text-destructive",
              )}
            >
              {l}
            </li>
          ))}
        </ol>
      )}
      <p className="sr-only" aria-live="polite">
        {run.lines.at(-1)}
      </p>
    </form>
  );
}

// Quests the safety check turned down, with its reason.
function DroppedQuests(props: { dropped: View["dropped"] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const n = props.dropped.length;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground">
        {n} {n === 1 ? "Quest" : "Quests"} dropped by the safety check
      </summary>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-1">
        {props.dropped.map((q) => (
          <li key={q.id} className="flex items-center gap-2">
            <span className="flex-1">
              <span className="font-medium">{q.title}</span> · {q.droppedReason}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(q.id);
                setError(null);
                try {
                  await deleteQuestFn({ data: { questId: q.id } });
                  await router.invalidate();
                } catch {
                  setError("Could not remove. Try again.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === q.id ? "Removing…" : "Remove"}
            </Button>
          </li>
        ))}
      </ul>
    </details>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const v = q.verdict;
  // On a worksheet, only a share of the Points is paid.
  const n = v?.answers.length ?? 0;
  const ok = v?.answers.filter((a) => a.outcome === "accepted").length ?? 0;
  const partial = v !== null && n > 0 && v.outcome !== "needs_parent";
  const points = partial ? Math.round((q.points * ok) / n) : q.points;
  const outcome = v
    ? partial
      ? `${ok} of ${n} accepted`
      : OUTCOME[v.outcome]
    : q.status === "done"
      ? "Done"
      : "";
  const overruled = v !== null && v.decidedBy !== "models" && v.modelOutcome !== v.outcome;
  const isCurrent = (choice: "accept" | "reject") => {
    if (!v || v.outcome === "needs_parent") return false;
    if (n > 0) return choice === "accept" ? ok === n : ok === 0;
    return (choice === "accept") === (v.outcome === "accepted");
  };
  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch {
      setError(message);
      return false;
    } finally {
      setBusy(false);
      await router.invalidate();
    }
  };
  return (
    <div className="flex flex-col">
      <button
        className="flex items-center gap-3 p-3 text-left hover:bg-accent/50"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setError(null);
        }}
      >
        <Cover quest={q} className="size-10 shrink-0" />
        <span className="min-w-0 flex-1 font-medium">{q.title}</span>
        <span
          className={cn("text-sm", v?.outcome === "needs_parent" ? "font-medium" : "text-muted-foreground")}
        >
          {overruled && !partial && (
            <s className="mr-2" aria-label={`Models said ${OUTCOME[v.modelOutcome]}`}>
              {OUTCOME[v.modelOutcome]}
            </s>
          )}
          {outcome}
        </span>
        <span className="text-right text-sm whitespace-nowrap tabular-nums text-muted-foreground">
          {partial ? `${points} of ${q.points}` : points} pts
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-3 pt-1 pb-4 md:pl-16">
          <p className="text-sm">{q.readAloud}</p>
          {v ? (
            <>
              <ProofView proof={v.proof} sam={v.sam} />
              {v.answers.length > 0 && v.proof.photoKey && (
                <WorksheetAnswers answers={v.answers} photoKey={v.proof.photoKey} />
              )}
              <ul className="flex flex-col gap-1 text-sm">
                {v.judges.map((j) => (
                  <li key={j.model}>
                    <span className="font-mono text-xs text-muted-foreground">{j.model}</span> {j.decision}{" "}
                    {Math.round(j.confidence * 100)}%{j.textOnly ? " (text only)" : ""} · {j.reason}
                  </li>
                ))}
              </ul>
              {overruled && (
                <p className="text-xs text-muted-foreground">
                  Models said {OUTCOME[v.modelOutcome]}; changed by {v.decidedByName ?? "a Parent"} on{" "}
                  <LocalDate value={v.decidedAt} />
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  {(["accept", "reject"] as const).map((choice) => (
                    <Button
                      key={choice}
                      variant={isCurrent(choice) ? "default" : "outline"}
                      aria-pressed={isCurrent(choice)}
                      disabled={busy}
                      onClick={async () => {
                        if (
                          v.outcome !== "needs_parent" &&
                          !isCurrent(choice) &&
                          !confirm(
                            choice === "reject"
                              ? `Take back ${points} Points and let ${q.title} be tried again?`
                              : `Give ${q.points - (partial ? points : 0)} Points for ${q.title}?`,
                          )
                        )
                          return;
                        const done = await run(
                          () => decideFn({ data: { verdictId: v.id, choice } }),
                          "Could not save. This Proof may have changed.",
                        );
                        // The row moves once sorted; close it so the next tap lands where expected.
                        if (done) setOpen(false);
                      }}
                    >
                      {choice === "accept"
                        ? v.answers.length > 0
                          ? "Accept all"
                          : "Accept"
                        : v.answers.length > 0
                          ? "Not yet for all"
                          : "Not yet"}
                    </Button>
                  ))}
                </div>
                {error && (
                  <p role="alert" className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <ModelLog of={{ verdictId: v.id }} title="How this Proof was checked" />
            </>
          ) : (
            error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )
          )}
          <ModelLog of={{ questId: q.id }} title="How this Quest was made" />
          <Button
            variant="ghost"
            className="self-start text-destructive"
            disabled={busy}
            onClick={async () => {
              if (!confirm(`Delete "${q.title}"? Points already earned stay.`)) return;
              await run(() => deleteQuestFn({ data: { questId: q.id } }), "Could not delete. Try again.");
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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [given, setGiven] = useState<string | null>(null);
  const { points, child } = props.view;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col divide-y rounded-lg border">
        {props.view.rewards.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="flex-1">{r.name}</span>
            <span className="text-sm tabular-nums text-muted-foreground">{r.price} Points</span>
            {points < r.price && (
              <span className="text-xs text-muted-foreground">{r.price - points} more</span>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || points < r.price}
              onClick={async () => {
                if (!confirm(`Give ${r.name} to ${child.nickname} for ${r.price} Points?`)) return;
                setBusy(r.id);
                setError(null);
                setGiven(null);
                try {
                  await giveRewardFn({ data: { childId: child.id, rewardId: r.id } });
                  setGiven(`Gave ${r.name}.`);
                } catch {
                  setError("Could not give this Reward. It may have changed. Try again.");
                } finally {
                  setBusy(null);
                  await router.invalidate();
                }
              }}
            >
              {busy === r.id ? "Giving…" : "Give"}
            </Button>
          </div>
        ))}
      </div>
      <p
        aria-live="polite"
        className={cn("text-xs empty:hidden", error ? "text-destructive" : "text-muted-foreground")}
      >
        {error ?? given}
      </p>
    </div>
  );
}

type Answer = NonNullable<Quest["verdict"]>["answers"][number];

// Each worksheet answer: its crop, what the models read, their Verdict, and the Parent's say.
function WorksheetAnswers(props: { answers: Answer[]; photoKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
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
              {a.decidedByName && a.modelOutcome !== a.outcome && (
                <span className="text-xs text-muted-foreground">
                  Models said {OUTCOME[a.modelOutcome]}; changed by {a.decidedByName}
                </span>
              )}
            </div>
            <span className={a.outcome === "needs_parent" ? "font-medium" : "text-muted-foreground"}>
              {a.decidedByName && a.modelOutcome !== a.outcome && (
                <s className="mr-1" aria-label={`Models said ${OUTCOME[a.modelOutcome]}`}>
                  {OUTCOME[a.modelOutcome]}
                </s>
              )}
              {OUTCOME[a.outcome]}
            </span>
            {(["accept", "reject"] as const).map((choice) => {
              const current =
                a.outcome !== "needs_parent" && (choice === "accept") === (a.outcome === "accepted");
              const label = choice === "accept" ? "Accept" : "Not yet";
              return (
                <Button
                  key={choice}
                  size="sm"
                  variant={current ? "default" : "outline"}
                  aria-pressed={current}
                  aria-label={`${label}: ${a.question}`}
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy(a.id);
                    setError(null);
                    try {
                      await decideAnswerFn({ data: { answerId: a.id, choice } });
                    } catch {
                      setError("Could not save. This Proof may have changed.");
                    } finally {
                      setBusy(null);
                      await router.invalidate();
                    }
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Copies a Starter Plan into the Plan box, as if the Parent typed it. Nothing is saved
// until Make quests.
function StarterPlans(props: { view: View; text: string; onUse: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Use a Starter Plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
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
                  type="button"
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => {
                    if (
                      props.text.trim() &&
                      props.text !== p.text &&
                      !confirm("Replace the text in the Plan box with this Starter Plan?")
                    )
                      return;
                    props.onUse(p.text);
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

const parentRoute = getRouteApi("/parent");

// Stakes, Sibling Board and PIN for one Child.
function ChildSettings(props: { view: View }) {
  const router = useRouter();
  const { child, demo } = props.view;
  const kids = parentRoute.useLoaderData();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSaved, setPinSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Shown straight away; put back if the save fails.
  const [stakes, setStakes] = useState(child.stakes);
  const [board, setBoard] = useState(child.siblingBoard);
  useEffect(() => setStakes(child.stakes), [child.stakes]);
  useEffect(() => setBoard(child.siblingBoard), [child.siblingBoard]);
  const save = async (settings: { stakes?: boolean | null; siblingBoard?: boolean }, revert: () => void) => {
    setError(null);
    try {
      await setChildSettingsFn({ data: { childId: child.id, ...settings } });
      await router.invalidate();
    } catch {
      revert();
      setError("Could not save. Try again.");
    }
  };
  const changePin = async (next: string | null) => {
    setPinError(null);
    setPinSaved(null);
    try {
      await setPinFn({ data: { childId: child.id, pin: next } });
      setPin("");
      setPinSaved(next ? "PIN set" : "PIN removed");
      await router.invalidate();
    } catch {
      setPinError("Could not save the PIN. Try again.");
    }
  };
  const siblings = kids.filter((k) => k.id !== child.id);
  const siblingsOn = siblings.filter((k) => k.siblingBoard);
  const boardHint =
    siblings.length === 0
      ? "Needs a sibling. Add another Child first."
      : !board
        ? `Shows ${child.nickname} how they compare with siblings this week.`
        : siblingsOn.length === 0
          ? `On. It appears once a sibling turns it on too (${siblings.map((k) => k.nickname).join(", ")}).`
          : `On with ${siblingsOn.map((k) => k.nickname).join(", ")}.`;
  return (
    <div className="flex flex-col gap-5 border-t pt-4 text-sm">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="stakes">Stakes</Label>
          <select
            id="stakes"
            className="h-8 rounded-md border bg-transparent px-2"
            value={stakes === null ? "default" : stakes ? "on" : "off"}
            onChange={(e) => {
              const before = stakes;
              const next = e.target.value === "default" ? null : e.target.value === "on";
              setStakes(next);
              void save({ stakes: next }, () => setStakes(before));
            }}
          >
            <option value="default">By age (from 8)</option>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">Lets {child.nickname} bet a bonus on harder Quests.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="sibling-board">Sibling Board</Label>
          <Switch
            id="sibling-board"
            checked={board}
            disabled={siblings.length === 0 && !board}
            onCheckedChange={(on) => {
              setBoard(on);
              void save({ siblingBoard: on }, () => setBoard(!on));
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{boardHint}</p>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <form
        className="flex flex-col gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{4}$/.test(pin)) return;
          await changePin(pin);
        }}
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="pin" className="flex-1">
            PIN
            <span className="font-normal text-muted-foreground">{child.hasPin ? "set" : "none"}</span>
          </Label>
          <Input
            id="pin"
            type="password"
            placeholder="4 digits"
            inputMode="numeric"
            autoComplete="off"
            className="w-24 tracking-widest"
            disabled={demo}
            value={pin}
            onChange={(e) => {
              setPinError(null);
              setPinSaved(null);
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            }}
          />
          <Button type="submit" size="sm" variant="outline" disabled={demo || pin.length !== 4}>
            {child.hasPin ? "Change" : "Set"}
          </Button>
          {child.hasPin && !demo && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove ${child.nickname}'s PIN?`)) void changePin(null);
              }}
            >
              Remove
            </Button>
          )}
        </div>
        <p
          aria-live="polite"
          className={cn("text-xs", pinError ? "text-destructive" : "text-muted-foreground")}
        >
          {demo
            ? "PINs are off in the Demo Family. Sign in with Google to set one."
            : (pinError ??
              pinSaved ??
              (pin.length > 0
                ? `Press ${child.hasPin ? "Change" : "Set"} to save the PIN.`
                : `${child.nickname} types this PIN before playing. Leave it unset to skip.`))}
        </p>
      </form>
    </div>
  );
}

// Recorded by a Parent with a reason; never shown to Children and never touches Points.
function Consequences(props: { view: View }) {
  const router = useRouter();
  const [privilege, setPrivilege] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <details className="flex flex-col gap-3">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        Consequences ({props.view.consequences.length})
      </summary>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !privilege.trim() || !reason.trim()) return;
          setBusy(true);
          setError(null);
          try {
            await recordConsequenceFn({ data: { childId: props.view.child.id, privilege, reason } });
            setPrivilege("");
            setReason("");
            await router.invalidate();
          } catch {
            setError("Could not record. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input
          aria-label="Privilege"
          placeholder="Privilege you control, e.g. no tablet tonight"
          maxLength={200}
          value={privilege}
          onChange={(e) => setPrivilege(e.target.value)}
        />
        <Input
          aria-label="Reason"
          placeholder="Reason"
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          type="submit"
          variant="outline"
          className="self-start"
          disabled={busy || !privilege.trim() || !reason.trim()}
        >
          {busy ? "Recording…" : "Record"}
        </Button>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </form>
      <ul className="mt-3 flex flex-col gap-1 text-sm">
        {props.view.consequences.map((c) => (
          <li key={c.id}>
            <span className="font-medium">{c.privilege}</span> · {c.reason}
            <span className="text-muted-foreground">
              {" "}
              · {c.parentName}, <LocalDate value={c.createdAt} />
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
  // Newest first, so the top row is the latest change to the balance. Entries from any Verdict,
  // not only a Quest's latest, carry their Quest's title.
  const rows = props.view.pointsLog.map((e) => ({ ...e, label: e.rewardName ?? e.questTitle })).reverse();
  return (
    <details>
      <summary className="cursor-pointer text-sm text-muted-foreground">Points log</summary>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-1 pr-3 text-muted-foreground">
                <LocalDate value={e.createdAt} />
              </td>
              <td className="py-1 pr-3">
                {POINTS_KIND[e.kind]}
                {e.label ? `: ${e.label}` : ""}
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
