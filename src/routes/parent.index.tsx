import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { ChildForm } from "#/components/child-form";
import { addChildFn, getSidebar } from "#/server/fns";

export const Route = createFileRoute("/parent/")({
  gcTime: 0,
  loader: async () => {
    const [first] = await getSidebar();
    if (first) throw redirect({ to: "/parent/$childId", params: { childId: first.id } });
  },
  head: () => ({ meta: [{ title: "Add your first Child · GameSchooling" }] }),
  component: FirstChild,
});

function FirstChild() {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="mx-auto mt-16 flex max-w-xs flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add your first Child</h1>
        <p className="text-sm text-muted-foreground">Only a nickname and age. Nothing else is stored.</p>
      </div>
      <ChildForm
        submitLabel="Add child"
        onSubmit={async (child) => {
          const childId = await addChildFn({ data: child });
          await router.invalidate();
          await navigate({ to: "/parent/$childId", params: { childId } });
        }}
      />
    </div>
  );
}
