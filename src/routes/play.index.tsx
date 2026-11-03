import { Link, createFileRoute } from "@tanstack/react-router";
import { getPlayPicker } from "#/server/fns";

export const Route = createFileRoute("/play/")({
  loader: () => getPlayPicker(),
  component: PickName,
});

function PickName() {
  const kids = Route.useLoaderData();
  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4">
        {kids.map((k) => (
          <Link
            key={k.id}
            to={k.hasPin ? "/play/$childId/pin" : "/play/$childId"}
            params={{ childId: k.id }}
            className="rounded-2xl bg-primary px-6 py-8 text-center text-3xl font-semibold text-primary-foreground"
          >
            {k.nickname}
          </Link>
        ))}
        <Link to="/parent" className="mt-8 text-center text-sm text-muted-foreground">
          Parent
        </Link>
      </div>
    </main>
  );
}
