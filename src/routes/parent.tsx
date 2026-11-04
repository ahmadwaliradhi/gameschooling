import { Link, Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gamepad2, LoaderCircle, LogOut, Plus, TriangleAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChildForm } from "#/components/child-form";
import { authClient } from "#/lib/auth-client";
import { useRunningChildIds } from "#/lib/make-quests-runs";
import { addChildFn, getLocksWhenHidden, getSidebar, lockParentFn } from "#/server/fns";

export const Route = createFileRoute("/parent")({
  loader: async () => {
    const [kids, locksWhenHidden] = await Promise.all([getSidebar(), getLocksWhenHidden()]);
    return { kids, locksWhenHidden };
  },
  // Parent screens are never kept: not by the browser (back/forward cache) nor by the router once left.
  headers: () => ({ "Cache-Control": "no-store" }),
  gcTime: 0,
  component: ParentLayout,
});

// Behind a Parent PIN, Parent screens stay open only while someone is looking at them.
function useLockWhenHidden(on: boolean) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!on) return;
    const lock = () => {
      if (document.visibilityState !== "hidden") return;
      void lockParentFn();
      void navigate({ to: "/play", replace: true });
    };
    // A page brought back from the back/forward cache asks again.
    const restored = (e: PageTransitionEvent) => e.persisted && location.replace("/play");
    document.addEventListener("visibilitychange", lock);
    window.addEventListener("pageshow", restored);
    return () => {
      document.removeEventListener("visibilitychange", lock);
      window.removeEventListener("pageshow", restored);
    };
  }, [on, navigate]);
}

function ParentLayout() {
  const { kids, locksWhenHidden } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  useLockWhenHidden(locksWhenHidden);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const running = useRunningChildIds();
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b bg-sidebar p-3 md:sticky md:top-0 md:max-h-dvh md:w-60 md:border-r md:border-b-0">
        <p className="hidden px-3 pt-1 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase md:block">
          Children
        </p>
        <div className="flex gap-1 overflow-x-auto md:min-h-0 md:flex-col md:overflow-x-visible">
          <nav className="flex gap-1 md:min-h-0 md:flex-col md:overflow-y-auto">
            {kids.map((k) => (
              <Link
                key={k.id}
                to="/parent/$childId"
                params={{ childId: k.id }}
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap hover:bg-accent max-md:max-w-44"
                activeProps={{ className: "bg-accent font-medium" }}
              >
                <span className="min-w-0 flex-1 truncate">{k.nickname}</span>
                {running.includes(k.id) && (
                  <>
                    <LoaderCircle
                      aria-hidden
                      className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                    />
                    <span className="sr-only">, making quests</span>
                  </>
                )}
                {k.needsParent && (
                  <>
                    <span
                      aria-hidden
                      title="A Quest needs your decision"
                      className="size-2 shrink-0 rounded-full bg-primary"
                    />
                    <span className="sr-only">, needs you</span>
                  </>
                )}
                <span className="shrink-0 tabular-nums text-muted-foreground" title="Points">
                  {k.points}
                  <span className="sr-only"> Points</span>
                </span>
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            className="justify-start text-muted-foreground max-md:h-auto max-md:rounded-full max-md:border max-md:border-dashed max-md:py-1.5"
            onClick={() => setAdding(true)}
          >
            <Plus /> Add child
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 pt-2 md:mt-auto md:flex-col md:flex-nowrap md:border-t md:pt-3">
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/parent/family" activeProps={{ className: "bg-accent font-medium" }}>
              <Users /> Family
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/play" title="Hand the device to a Child">
              <Gamepad2 /> Play
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-muted-foreground"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              setSignOutError(false);
              try {
                const { error } = await authClient.signOut();
                if (error) throw error;
                await navigate({ to: "/" });
              } catch {
                setSignOutError(true);
              } finally {
                setSigningOut(false);
              }
            }}
          >
            <LogOut /> {signingOut ? "Signing out…" : "Sign out"}
          </Button>
          {signOutError && (
            <p role="alert" className="w-full px-3 text-xs text-destructive">
              Could not sign out. Try again.
            </p>
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <RunningWarning names={kids.filter((k) => running.includes(k.id)).map((k) => k.nickname)} />
        <Outlet />
      </main>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add child</DialogTitle>
          </DialogHeader>
          <ChildForm
            submitLabel="Add"
            onSubmit={async (child) => {
              const childId = await addChildFn({ data: child });
              setAdding(false);
              await router.invalidate();
              await navigate({ to: "/parent/$childId", params: { childId } });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Make quests runs in this browser tab. Say so while any run is going, on every Parent page.
function RunningWarning(props: { names: string[] }) {
  if (props.names.length === 0) return null;
  const who =
    props.names.length === 1
      ? props.names[0]
      : `${props.names.slice(0, -1).join(", ")} and ${props.names.at(-1)}`;
  return (
    <div
      role="status"
      className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-medium">Making quests for {who}.</span> Keep this tab open until{" "}
        {props.names.length === 1 ? "it finishes" : "they finish"}. You can switch between Children, but
        reloading or closing this tab stops {props.names.length === 1 ? "it" : "them"}. Quests already made
        are kept.
      </p>
    </div>
  );
}
