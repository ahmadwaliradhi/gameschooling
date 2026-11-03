import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, demoSignIn } from "#/lib/auth-client";
import { getSignedIn } from "#/server/fns";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (await getSignedIn()) throw redirect({ to: "/parent" });
  },
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <main className="flex-1 grid place-items-center p-6">
      <div className="flex w-full max-w-xs flex-col gap-3">
        <h1 className="mb-6 text-center text-3xl font-semibold tracking-tight">GameSchooling</h1>
        <Button
          size="lg"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void authClient.signIn.social({ provider: "google", callbackURL: "/parent" });
          }}
        >
          Sign in with Google
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await demoSignIn();
              await navigate({ to: "/parent" });
            } finally {
              setBusy(false);
            }
          }}
        >
          Demo
        </Button>
      </div>
    </main>
  );
}
