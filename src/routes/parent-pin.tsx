import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PinPad } from "#/components/pin-pad";
import { authClient } from "#/lib/auth-client";
import { enterParentPinFn, getParentPinPad } from "#/server/fns";

// Outside /parent so its layout (which needs the Parent PIN) does not run first.
export const Route = createFileRoute("/parent-pin")({
  loader: async () => {
    const pad = await getParentPinPad();
    if (!pad) throw redirect({ to: "/parent" });
    return pad;
  },
  component: ParentPinPad,
});

function ParentPinPad() {
  const pad = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <PinPad
      title="Parent PIN"
      pausedUntil={pad.pausedUntil}
      enter={(pin) => enterParentPinFn({ data: { pin } })}
      onUnlocked={() => navigate({ to: "/parent" })}
    >
      <div className="flex flex-col items-center gap-2">
        <Link to="/play" className="text-lg text-muted-foreground">
          Play
        </Link>
        <Button
          variant="link"
          className="text-sm text-muted-foreground"
          onClick={async () => {
            await authClient.signOut();
            await navigate({ to: "/" });
          }}
        >
          Forgot PIN? Sign in again
        </Button>
      </div>
    </PinPad>
  );
}
