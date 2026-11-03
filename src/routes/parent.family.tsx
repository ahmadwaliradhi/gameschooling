import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  if (props.family.digests.length === 0) {
    return <p className="text-sm text-muted-foreground">A Weekly Digest arrives here every Monday.</p>;
  }
  return (
    <section className="flex flex-col gap-6">
      {props.family.digests.map((d) => (
        <article key={d.id} className="flex flex-col gap-3">
          <h2 className="font-medium">Week of {d.week}</h2>
          {d.entries.map((e) => (
            <div key={e.childId} className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{e.nickname}</span>
              <p>{e.learned}</p>
              {e.struggled && <p className="text-muted-foreground">{e.struggled}</p>}
              <Link
                to="/parent/$childId"
                params={{ childId: e.childId }}
                className="text-xs text-muted-foreground underline"
              >
                Based on {e.verdictIds.length} Verdicts
              </Link>
            </div>
          ))}
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground">Model log</summary>
            <ModelLog of={{ runId: d.runId }} />
          </details>
        </article>
      ))}
    </section>
  );
}

function FamilyGoal(props: { family: Family }) {
  const router = useRouter();
  const goal = props.family.familyGoal;
  const [target, setTarget] = useState(String(goal?.target ?? ""));
  const [reward, setReward] = useState(goal?.rewardName ?? "");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="flex-1 font-medium">Family Goal</h2>
        <label className="flex items-center gap-2 text-sm">
          On
          <input
            type="checkbox"
            checked={props.family.familyGoalOn}
            onChange={async (e) => {
              await setFamilyGoalOnFn({ data: { on: e.target.checked } });
              await router.invalidate();
            }}
          />
        </label>
      </div>
      {!goal ? (
        <p className="text-sm text-muted-foreground">Shown once the Family has two or more Children.</p>
      ) : (
        <>
          <p className="text-sm">
            This week: {goal.progress} of {goal.target} Points towards {goal.rewardName}
            {goal.given ? " · given" : goal.reached ? " · reached" : ""}
          </p>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await setFamilyGoalFn({ data: { target: Number(target), rewardName: reward } });
              await router.invalidate();
            }}
          >
            <Input
              aria-label="Weekly target"
              inputMode="numeric"
              className="w-28"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            />
            <Input
              aria-label="Shared Reward"
              className="flex-1"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={!Number(target) || !reward.trim()}>
              Save
            </Button>
          </form>
          {goal.reached && !goal.given && (
            <Button
              className="self-start"
              onClick={async () => {
                await giveFamilyGoalFn();
                await router.invalidate();
              }}
            >
              Reward given
            </Button>
          )}
        </>
      )}
    </section>
  );
}

function Parents(props: { family: Family }) {
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium">Parents</h2>
      <ul className="flex flex-col divide-y rounded-lg border">
        {props.family.parents.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
            <span className="flex-1">
              {p.name} <span className="text-muted-foreground">{p.email}</span>
            </span>
            {props.family.parents.length > 1 && !props.family.demo && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!confirm(`Remove ${p.name} as a Parent?`)) return;
                  await removeParentFn({ data: { parentId: p.id } });
                  await router.invalidate();
                }}
              >
                {p.id === props.family.me ? "Leave" : "Remove"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {!props.family.demo && (
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="self-start"
            onClick={async () => {
              const { token } = await createInviteFn();
              setLink(`${location.origin}/invite/${token}`);
            }}
          >
            Invite a Parent
          </Button>
          {link && (
            <p className="text-sm">
              Send this link to the other adult. It works once, for 7 days:{" "}
              <button
                className="font-mono break-all underline"
                onClick={() => void navigator.clipboard.writeText(link)}
              >
                {link}
              </button>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
