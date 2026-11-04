import { Link, Outlet, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Gamepad2, LogOut, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChildForm } from "#/components/child-form";
import { authClient } from "#/lib/auth-client";
import { addChildFn, getSidebar } from "#/server/fns";

export const Route = createFileRoute("/parent")({
  loader: () => getSidebar(),
  component: ParentLayout,
});

function ParentLayout() {
  const kids = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
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
