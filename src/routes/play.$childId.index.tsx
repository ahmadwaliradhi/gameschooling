import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, PartyPopper, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileUrl } from "#/components/proof-view";
import { speak } from "#/lib/speak";
import { getChildView } from "#/server/fns";

export const Route = createFileRoute("/play/$childId/")({
  loader: ({ params }) => getChildView({ data: { childId: params.childId } }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.child.nickname ?? "Play"} · GameSchooling` }],
  }),
  component: QuestGrid,
});

function QuestGrid() {
  const view = Route.useLoaderData();
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <header className="flex items-center gap-4">
        <Link
          to="/play"
          className="flex min-w-0 items-center gap-1 text-2xl font-semibold"
          aria-label={`${view.child.nickname}, back to names`}
        >
          <ChevronLeft className="size-6 shrink-0 text-muted-foreground" />
          <span className="truncate">{view.child.nickname}</span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-4">
          {view.streak && view.streak.weeks > 0 && (
            <span className="text-lg text-muted-foreground" title="Weeks in a row with Points">
              {view.streak.weeks} {view.streak.weeks === 1 ? "week" : "weeks"}
            </span>
          )}
          <span className="rounded-full bg-primary px-4 py-1 text-2xl font-semibold tabular-nums text-primary-foreground">
            {view.points}
          </span>
        </div>
      </header>
      {view.nextReward && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-lg">
            <span>{view.nextReward.name}</span>
            <span className="tabular-nums">{view.nextReward.price}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, (100 * view.points) / view.nextReward.price)}%` }}
            />
          </div>
        </div>
      )}
      {view.familyGoal && !view.familyGoal.given && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-lg">
            <span>Together: {view.familyGoal.rewardName}</span>
            <span className="tabular-nums">
              {view.familyGoal.progress} / {view.familyGoal.target}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(100, (100 * view.familyGoal.progress) / view.familyGoal.target)}%`,
              }}
            />
          </div>
        </div>
      )}
      {view.siblingBoard && (
        <section className="flex flex-col gap-1 rounded-2xl border p-3 text-lg">
          <h2 className="text-sm font-medium text-muted-foreground">This week</h2>
          <ol className="flex flex-col gap-1">
            {view.siblingBoard.map((r) => (
              <li key={r.childId} className={`flex justify-between ${r.me ? "font-semibold" : ""}`}>
                <span>{r.nickname}</span>
                <span className="tabular-nums">{r.progress}%</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {view.quests.map((q) => (
          <Link
            key={q.id}
            to="/play/$childId/$questId"
            params={{ childId: view.child.id, questId: q.id }}
            className="relative aspect-square overflow-hidden rounded-2xl"
            style={{ background: q.coverColor }}
            aria-label={q.state === "try_again" ? `${q.title}, try again` : q.title}
          >
            {q.coverKey && <img src={fileUrl(q.coverKey)} alt="" className="size-full object-cover" />}
            {q.state === "waiting" && <span className="absolute inset-0 bg-background/60" />}
            {!q.coverKey && (
              <span className="absolute inset-x-3 top-3 line-clamp-3 text-lg font-semibold text-neutral-900">
                {q.title}
              </span>
            )}
            {q.state === "try_again" && (
              <span className="absolute bottom-2 left-2 rounded-full bg-background/90 p-1">
                <RotateCcw className="size-5" />
              </span>
            )}
            <span className="absolute right-2 bottom-2 rounded-full bg-background/90 px-3 py-0.5 font-semibold tabular-nums">
              {q.points}
            </span>
          </Link>
        ))}
      </div>
      {view.quests.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12">
          <PartyPopper className="size-24 text-primary" />
          <p className="text-2xl font-semibold">All done!</p>
          <Button
            size="lg"
            variant="outline"
            onClick={() => "speechSynthesis" in window && speak("All done! Ask Mum or Dad for more Quests.")}
          >
            <Volume2 /> Listen
          </Button>
        </div>
      )}
    </main>
  );
}
