import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getPlayPicker } from "#/server/fns";

export const Route = createFileRoute("/play/")({
  // getPlayPicker locks every Child, so a hover preload must not run it.
  // (A loader that returns null on preload would leave null cached, and the
  // real visit would flash "No Children yet" before reloading.)
  preload: false,
  loader: () => getPlayPicker(),
  component: PickName,
});

function PickName() {
  const kids = Route.useLoaderData();
  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4">
        {kids.length === 0 && (
          <p className="text-center text-lg text-muted-foreground">
            No Children yet. Add one in the Parent area.
          </p>
        )}
        {kids.map((k) => (
          <Link
            key={k.id}
            to={k.hasPin ? "/play/$childId/pin" : "/play/$childId"}
            params={{ childId: k.id }}
            className="rounded-2xl bg-primary px-6 py-8 text-center text-3xl font-semibold break-words text-primary-foreground"
          >
            {k.nickname}
          </Link>
        ))}
        {kids.length === 0 ? (
          <Button asChild size="lg">
            <Link to="/parent">Go to Parent area</Link>
          </Button>
        ) : (
          <Link to="/parent" className="mt-8 text-center text-sm text-muted-foreground">
            Parent
          </Link>
        )}
      </div>
    </main>
  );
}
