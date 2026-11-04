import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { acceptInviteFn, getSignedIn } from "#/server/fns";

export const Route = createFileRoute("/invite/$token")({
  validateSearch: (s: Record<string, unknown>): { error?: string } => ({
    error: s.error == null || s.error === "" ? undefined : String(s.error),
  }),
  loader: () => getSignedIn(),
  head: () => ({ meta: [{ title: "Join a Family · GameSchooling" }] }),
  component: Invite,
});

// An invited adult signs in with their own account and joins the Family as an equal Parent.
function Invite() {
  const signedIn = Route.useLoaderData();
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    search.error ? "Google sign-in did not finish. Try again." : null,
  );
  const [busy, setBusy] = useState(false);
  // Back from Google restores this page from bfcache with the button still disabled.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
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
              setError(null);
              try {
                await acceptInviteFn({ data: { token } });
                await navigate({ to: "/parent" });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not join");
                setBusy(false);
              }
            }}
          >
            {busy ? "Joining…" : "Join as a Parent"}
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const { error } = await authClient.signIn.social({
                  provider: "google",
                  callbackURL: `/invite/${token}`,
                  errorCallbackURL: `/invite/${token}`,
                });
                if (error) {
                  setError("Could not start Google sign-in. Try again.");
                  setBusy(false);
                }
              } catch {
                setError("Could not start Google sign-in. Try again.");
                setBusy(false);
              }
            }}
          >
            {busy ? "Opening Google…" : "Sign in with Google"}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {error && signedIn && (
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const { error } = await authClient.signOut();
                  if (error) throw error;
                  setError(null);
                  await router.invalidate();
                } catch {
                  setError("Could not sign out. Try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Use a different account
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/parent">Go to my Family</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
