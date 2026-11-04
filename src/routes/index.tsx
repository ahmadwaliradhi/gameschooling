import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, demoSignIn } from "#/lib/auth-client";
import { getHome } from "#/server/fns";

export const Route = createFileRoute("/")({
  // better-auth appends ?error=<code> to errorCallbackURL; a repeated key parses as an array.
  validateSearch: (s: Record<string, unknown>): { error?: string } => ({
    error: s.error == null || s.error === "" ? undefined : String(s.error),
  }),
  beforeLoad: async () => {
    const home = await getHome();
    if (home) throw redirect({ to: home });
  },
  head: () => ({ meta: [{ title: "Sign in · GameSchooling" }] }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(
    search.error ? "Google sign-in did not finish. Try again." : null,
  );
  // Back from Google restores this page from bfcache with the buttons still disabled.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return (
    <main className="flex-1 grid place-items-center p-6">
      <div className="flex w-full max-w-xs flex-col gap-3">
        <div className="mb-6 flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">GameSchooling</h1>
          <p className="text-sm text-muted-foreground">
            Write a Plan for your Child. Get Quests they play and prove on your device.
          </p>
        </div>
        <Button
          size="lg"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("google");
            setError(null);
            try {
              const { error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
                errorCallbackURL: "/",
              });
              if (error) {
                setError("Could not start Google sign-in. Try again.");
                setBusy(null);
              }
            } catch {
              setError("Could not start Google sign-in. Try again.");
              setBusy(null);
            }
          }}
        >
          {busy === "google" ? "Opening Google…" : "Sign in with Google"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("demo");
            setError(null);
            try {
              await demoSignIn();
              await navigate({ to: (await getHome()) ?? "/parent" });
            } catch {
              setError("Could not open the Demo Family. Try again.");
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "demo" ? "Opening the Demo…" : "Try the Demo Family"}
        </Button>
        {error && (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-center text-xs text-muted-foreground">
          The Demo Family is shared and reset nightly. PINs and invites are off there.
        </p>
      </div>
    </main>
  );
}
