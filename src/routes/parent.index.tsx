import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { ChildForm } from "#/components/child-form";
import { addChildFn, getSidebar } from "#/server/fns";

export const Route = createFileRoute("/parent/")({
  gcTime: 0,
  loader: async () => {
    const [first] = await getSidebar();
    if (first) throw redirect({ to: "/parent/$childId", params: { childId: first.id } });
  },
  component: FirstChild,
});

function FirstChild() {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="mx-auto mt-16 max-w-xs">
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
