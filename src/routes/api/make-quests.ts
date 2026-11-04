import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { deps } from "#/server/deps";
import { parentLocked423 } from "#/server/parent-lock";
import { parentOr401 } from "#/server/session";
import { NotFoundError } from "#/services/deps";
import { savePlan } from "#/services/family";
import { makeQuests } from "#/services/make-quests";

const Body = z.object({ childId: z.string(), planText: z.string().max(20000).optional() });

// One request that saves the Plan box text, then streams progress lines while Quests are made.
export const Route = createFileRoute("/api/make-quests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parent = await parentOr401(request);
        if (parent instanceof Response) return parent;
        const locked = await parentLocked423(parent, request);
        if (locked) return locked;
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { childId, planText } = parsed.data;
        const d = deps();
        if (planText !== undefined) {
          try {
            await savePlan(d.db, parent.familyId, childId, planText);
          } catch (e) {
            if (e instanceof NotFoundError) return new Response("Child not found", { status: 404 });
            console.error("make-quests: save Plan failed", e);
            return new Response("Could not save the Plan", { status: 500 });
          }
        }
        const lines = makeQuests(d, { familyId: parent.familyId, childId });
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
