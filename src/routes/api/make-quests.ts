import { createFileRoute } from "@tanstack/react-router";
import { deps } from "#/server/deps";
import { parentOr401 } from "#/server/session";
import { makeQuests } from "#/services/make-quests";

// One request that streams progress lines while Quests are made.
export const Route = createFileRoute("/api/make-quests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parent = await parentOr401(request);
        if (parent instanceof Response) return parent;
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
              console.error("make-quests: run failed", e);
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
