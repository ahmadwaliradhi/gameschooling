import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { PinPad } from "#/components/pin-pad";
import { enterPinFn, getPinPad } from "#/server/fns";

export const Route = createFileRoute("/play/$childId/pin")({
  loader: ({ params }) => getPinPad({ data: { childId: params.childId } }),
  component: ChildPinPad,
});

// Big number buttons a Child can press on their own.
function ChildPinPad() {
  const child = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <PinPad
      title={child.nickname}
      pausedUntil={child.pausedUntil}
      enter={(pin) => enterPinFn({ data: { childId: child.id, pin } })}
      onUnlocked={() => navigate({ to: "/play/$childId", params: { childId: child.id } })}
    >
      <Link to="/play" className="text-lg text-muted-foreground">
        Back
      </Link>
    </PinPad>
  );
}
