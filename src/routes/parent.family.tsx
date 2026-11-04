import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModelLog } from "#/components/model-log";
import {
  createInviteFn,
  getFamily,
  giveFamilyGoalFn,
  removeParentFn,
  setFamilyGoalFn,
  setFamilyGoalOnFn,
} from "#/server/fns";

export const Route = createFileRoute("/parent/family")({
  loader: () => getFamily(),
  head: () => ({ meta: [{ title: "Family · GameSchooling" }] }),
  component: FamilyPage,
});

type Family = Awaited<ReturnType<typeof getFamily>>;

function FamilyPage() {
  const family = Route.useLoaderData();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <h1 className="text-2xl font-semibold tracking-tight">Family</h1>
      <Digests family={family} />
      <FamilyGoal family={family} />
      <Parents family={family} />
    </div>
  );
}

function Digests(props: { family: Family }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-medium">Weekly Digests</h2>
      {props.family.digests.length === 0 ? (
        <p className="text-sm text-muted-foreground">A Weekly Digest arrives here every Monday.</p>
      ) : (
        props.family.digests.map((d) => (
          <article key={d.id} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Week of {formatWeek(d.week)}</h3>
            {d.entries.map((e) => (
              <div key={e.childId} className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{e.nickname || "Removed Child"}</span>
                <p>{e.learned}</p>
                {e.struggled && <p className="text-muted-foreground">Found hard: {e.struggled}</p>}
                <Link
                  to="/parent/$childId"
                  params={{ childId: e.childId }}
                  className="text-xs text-muted-foreground underline"
                >
                  Based on {e.verdictIds.length} {e.verdictIds.length === 1 ? "Verdict" : "Verdicts"}
                </Link>
              </div>
            ))}
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">Model log</summary>
              <ModelLog of={{ runId: d.runId }} />
            </details>
          </article>
        ))
      )}
    </section>
  );
}

function formatWeek(week: string) {
  const date = new Date(`${week}T00:00:00`);
  if (Number.isNaN(date.getTime())) return week;
  return date.toLocaleDateString("en", { month: "long", day: "numeric" });
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function FamilyGoal(props: { family: Family }) {
  const router = useRouter();
  const goal = props.family.familyGoal;
  const [switchBusy, setSwitchBusy] = useState(false);
  const [switchError, setSwitchError] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [giving, setGiving] = useState(false);
  const [giveError, setGiveError] = useState(false);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 font-medium">Family Goal</h2>
        <Label htmlFor="family-goal-on" className="font-normal">
          {props.family.familyGoalOn ? "On" : "Off"}
          <Switch
            id="family-goal-on"
            aria-label="Family Goal"
            checked={props.family.familyGoalOn}
            disabled={switchBusy}
            onCheckedChange={async (on) => {
              setSwitchBusy(true);
              setSwitchError(false);
              try {
                await setFamilyGoalOnFn({ data: { on } });
                await router.invalidate();
              } catch {
                setSwitchError(true);
              } finally {
                setSwitchBusy(false);
              }
            }}
          />
        </Label>
      </div>
      {switchError && <p className="text-sm text-destructive">Could not change the Family Goal.</p>}
      {!props.family.familyGoalOn ? (
        <p className="text-sm text-muted-foreground">Off. Children don't see a shared goal.</p>
      ) : !goal ? (
        <p className="text-sm text-muted-foreground">Shown once the Family has two or more Children.</p>
      ) : (
        <>
          <p className="text-sm">
            This week: {goal.progress} of {goal.target} Points towards {goal.rewardName}
            {goal.given ? " · given" : goal.reached ? " · reached" : ""}
          </p>
          <GoalForm
            key={`${goal.target}|${goal.rewardName}`}
            goal={goal}
            status={status}
            onEdit={() => setStatus("idle")}
            onSave={async (data) => {
              setStatus("saving");
              try {
                await setFamilyGoalFn({ data });
                await router.invalidate();
                setStatus("saved");
              } catch {
                setStatus("error");
              }
            }}
          />
          {goal.reached && !goal.given && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={giving}
                onClick={async () => {
                  if (
                    !confirm(
                      `Mark "${goal.rewardName}" as given? Children stop seeing the goal until next week.`,
                    )
                  )
                    return;
                  setGiving(true);
                  setGiveError(false);
                  try {
                    await giveFamilyGoalFn();
                    await router.invalidate();
                  } catch {
                    setGiveError(true);
                  } finally {
                    setGiving(false);
                  }
                }}
              >
                {giving ? "Saving…" : "Mark Reward as given"}
              </Button>
              {giveError && <p className="text-sm text-destructive">Could not save. Try again.</p>}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function GoalForm(props: {
  goal: NonNullable<Family["familyGoal"]>;
  status: SaveStatus;
  onEdit: () => void;
  onSave: (data: { target: number; rewardName: string }) => Promise<void>;
}) {
  const [target, setTarget] = useState(String(props.goal.target));
  const [reward, setReward] = useState(props.goal.rewardName);
  const saving = props.status === "saving";
  const tooHigh = Number(target) > 100000;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await props.onSave({ target: Number(target), rewardName: reward });
      }}
    >
      <div className="flex w-28 flex-col gap-1.5">
        <Label htmlFor="goal-target">Weekly Points</Label>
        <Input
          id="goal-target"
          inputMode="numeric"
          maxLength={6}
          value={target}
          aria-invalid={tooHigh || undefined}
          aria-describedby={tooHigh ? "goal-target-error" : undefined}
          onChange={(e) => {
            setTarget(e.target.value.replace(/\D/g, ""));
            if (props.status !== "idle") props.onEdit();
          }}
        />
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1.5">
        <Label htmlFor="goal-reward">Shared Reward</Label>
        <Input
          id="goal-reward"
          maxLength={100}
          value={reward}
          onChange={(e) => {
            setReward(e.target.value);
            if (props.status !== "idle") props.onEdit();
          }}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={saving || tooHigh || !Number(target) || !reward.trim()}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
      {tooHigh && (
        <p id="goal-target-error" className="basis-full text-sm text-destructive">
          Use at most 100000 Points.
        </p>
      )}
      {props.status === "saved" && <p className="self-center text-sm text-muted-foreground">Saved</p>}
      {props.status === "error" && (
        <p className="self-center text-sm text-destructive">Could not save. Try again.</p>
      )}
    </form>
  );
}

function Parents(props: { family: Family }) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Parents</h2>
      <ul className="flex flex-col divide-y rounded-lg border">
        {props.family.parents.map((p) => {
          const self = p.id === props.family.me;
          return (
            <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1">
                {p.name}
                {self && " (you)"}
                <span className="block truncate text-muted-foreground">{p.email}</span>
              </span>
              {props.family.parents.length > 1 && !props.family.demo && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive"
                  disabled={removing !== null}
                  onClick={async () => {
                    const message = self
                      ? "Leave this Family? You lose access to its Children and start a new, empty Family."
                      : `Remove ${p.name} as a Parent? They lose access to this Family.`;
                    if (!confirm(message)) return;
                    setRemoving(p.id);
                    setRemoveError(null);
                    try {
                      await removeParentFn({ data: { parentId: p.id } });
                      if (self) await router.navigate({ to: "/parent" });
                      await router.invalidate();
                    } catch (e) {
                      setRemoveError(e instanceof Error ? e.message : "Could not remove");
                      await router.invalidate().catch(() => {});
                    } finally {
                      setRemoving(null);
                    }
                  }}
                >
                  {removing === p.id ? "Removing…" : self ? "Leave" : "Remove"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {removeError && <p className="text-sm text-destructive">{removeError}</p>}
      {!props.family.demo && (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="self-start"
            disabled={inviting}
            onClick={async () => {
              setInviting(true);
              setInviteError(false);
              try {
                const { token } = await createInviteFn();
                setLink(`${location.origin}/invite/${token}`);
                setCopied("idle");
              } catch {
                setInviteError(true);
              } finally {
                setInviting(false);
              }
            }}
          >
            {inviting ? "Creating link…" : link ? "Make a new link" : "Invite a Parent"}
          </Button>
          {inviteError && <p className="text-sm text-destructive">Could not create a link.</p>}
          {link && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm">Send this link to the other adult. It works once, for 7 days.</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  aria-label="Invite link"
                  className="font-mono"
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link);
                      setCopied("copied");
                    } catch {
                      setCopied("failed");
                    }
                  }}
                >
                  {copied === "copied" ? "Copied" : "Copy link"}
                </Button>
              </div>
              {copied === "failed" && (
                <p className="text-sm text-destructive">Could not copy. Select the link and copy it.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
