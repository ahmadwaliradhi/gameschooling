import { Link, createFileRoute } from "@tanstack/react-router";
import { fileUrl } from "#/components/proof-view";
import { getChildView } from "#/server/fns";

export const Route = createFileRoute("/play/$childId/")({
  loader: ({ params }) => getChildView({ data: { childId: params.childId } }),
  component: QuestGrid,
});

function QuestGrid() {
  const view = Route.useLoaderData();
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <header className="flex items-center gap-4">
        <Link to="/play" className="text-2xl font-semibold">
          {view.child.nickname}
        </Link>
        <span className="ml-auto rounded-full bg-primary px-4 py-1 text-2xl font-semibold tabular-nums text-primary-foreground">
          {view.points}
        </span>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {view.quests.map((q) => (
          <Link
            key={q.id}
            to="/play/$childId/$questId"
            params={{ childId: view.child.id, questId: q.id }}
            className="relative aspect-square overflow-hidden rounded-2xl"
            style={{ background: q.coverColor }}
            aria-label={q.title}
          >
            {q.coverKey && <img src={fileUrl(q.coverKey)} alt="" className="size-full object-cover" />}
            {q.state === "waiting" && <span className="absolute inset-0 bg-background/60" />}
            <span className="absolute right-2 bottom-2 rounded-full bg-background/90 px-3 py-0.5 font-semibold tabular-nums">
              {q.points}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
