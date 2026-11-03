import { createFileRoute } from "@tanstack/react-router";
import { deps } from "#/server/deps";
import { requireParent, SignedOutError } from "#/server/session";
import { makeQuests } from "#/services/make-quests";

// One request that streams progress lines while Quests are made.
export const Route = createFileRoute("/api/make-quests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parent;
        try {
          parent = await requireParent(request.headers);
        } catch (e) {
          if (e instanceof SignedOutError) return new Response("Signed out", { status: 401 });
          throw e;
        }
        const { childId } = (await request.json()) as { childId: string };
        const lines = makeQuests(deps(), { familyId: parent.familyId, childId });
        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const next = await lines.next();
              if (next.done) controller.close();
              else controller.enqueue(encoder.encode(`${next.value}\n`));
            } catch (e) {
              controller.enqueue(
                encoder.encode(`Could not make Quests: ${e instanceof Error ? e.message : e}\n`),
              );
              controller.close();
            }
          },
        });
        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
