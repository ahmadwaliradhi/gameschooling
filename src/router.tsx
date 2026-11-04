import {
  type ErrorComponentProps,
  Link,
  createRouter as createTanStackRouter,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 300,
    defaultPendingComponent: () => (
      <div role="status" aria-label="Loading" className="grid flex-1 place-items-center p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    ),
    defaultErrorComponent: ErrorScreen,
  });

  return router;
}

// Every route falls back to this, so a Child on a play screen always has a way out.
function ErrorScreen({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  // On a play screen "Home" stays in Play instead of opening the Parent area.
  const inPlay = useLocation({ select: (l) => l.pathname.startsWith("/play") });
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error && error.message ? error.message : "This page could not load."}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              reset();
              void router.invalidate();
            }}
          >
            Try again
          </Button>
          <Button variant="outline" asChild>
            {inPlay ? <Link to="/play">Back to Play</Link> : <Link to="/">Home</Link>}
          </Button>
        </div>
      </div>
    </div>
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
