import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { acceptInviteFn, getSignedIn } from "#/server/fns";

export const Route = createFileRoute("/invite/$token")({
  loader: () => getSignedIn(),
  component: Invite,
});

// An invited adult signs in with their own account and joins the Family as an equal Parent.
function Invite() {
  const signedIn = Route.useLoaderData();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid flex-1 place-items-center p-6">
      <div className="flex w-full max-w-xs flex-col gap-3 text-center">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Join a Family on GameSchooling</h1>
        {signedIn ? (
          <Button
            size="lg"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await acceptInviteFn({ data: { token } });
                await navigate({ to: "/parent" });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not join");
                setBusy(false);
              }
            }}
          >
            Join as a Parent
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() =>
              void authClient.signIn.social({ provider: "google", callbackURL: `/invite/${token}` })
            }
          >
            Sign in with Google
          </Button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </main>
  );
}
