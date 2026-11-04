import { Link, Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChildForm } from "#/components/child-form";
import { authClient } from "#/lib/auth-client";
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
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b bg-sidebar p-3 md:w-60 md:border-r md:border-b-0">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {kids.map((k) => (
            <Link
              key={k.id}
              to="/parent/$childId"
              params={{ childId: k.id }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap hover:bg-accent"
              activeProps={{ className: "bg-accent font-medium" }}
            >
              <span className="flex-1">{k.nickname}</span>
              {k.needsParent && <span aria-label="Needs you" className="size-2 rounded-full bg-primary" />}
              <span className="tabular-nums text-muted-foreground">{k.points}</span>
            </Link>
          ))}
        </nav>
        <Button variant="ghost" className="justify-start" onClick={() => setAdding(true)}>
          Add child
        </Button>
        <div className="mt-auto flex gap-1 pt-4 md:flex-col">
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/parent/family">Family</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/play">Play</Link>
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-muted-foreground"
            onClick={async () => {
              await authClient.signOut();
              await navigate({ to: "/" });
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-sm">
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
