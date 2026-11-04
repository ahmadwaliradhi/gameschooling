import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { quests } from "#/db/schema";
import { cookieToken, isUnlocked } from "#/server/child-lock";
import { deps } from "#/server/deps";
import { parentOr401 } from "#/server/session";
import { checkProof, ProofKindError, type ProofInput, WaitingForParentError } from "#/services/check-proof";
import { NotFoundError } from "#/services/deps";

const MAX_BYTES = 12 * 1024 * 1024;

export const Route = createFileRoute("/api/proof")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const parent = await parentOr401(request);
          if (parent instanceof Response) return parent;
          const { familyId } = parent;
          const form = await request.formData();
          const questId = String(form.get("questId") ?? "");
          const kind = String(form.get("kind") ?? "");
          const { db } = deps();
          const quest = await db.query.quests.findFirst({
            where: and(eq(quests.id, questId), eq(quests.familyId, familyId)),
          });
          if (!quest) return new Response("Quest not found", { status: 404 });
          if (!(await isUnlocked(familyId, quest.childId, cookieToken(request)))) {
            return new Response("Enter the PIN first", { status: 403 });
          }
          let proof: ProofInput;
          if (kind === "text") {
            proof = { kind, text: String(form.get("text") ?? "").slice(0, 5000) };
          } else {
            const file = form.get("file");
            if (!(file instanceof File) || file.size > MAX_BYTES)
              return new Response("Bad file", { status: 400 });
            const bytes = new Uint8Array(await file.arrayBuffer());
            const width = Number(form.get("width"));
            const height = Number(form.get("height"));
            if (kind === "photo") proof = { kind, bytes, contentType: file.type || "image/jpeg" };
            else if (kind === "worksheet" && width > 0 && height > 0)
              proof = { kind, bytes, contentType: file.type || "image/jpeg", width, height };
            else if (kind === "voice") proof = { kind, wav: bytes };
            else return new Response("Bad kind", { status: 400 });
          }
          return Response.json(await checkProof(deps(), { familyId, questId, proof }));
        } catch (e) {
          if (e instanceof NotFoundError) return new Response(e.message, { status: 404 });
          if (e instanceof ProofKindError) return new Response(e.message, { status: 400 });
          if (e instanceof WaitingForParentError) return new Response(e.message, { status: 409 });
          console.error(e);
          return new Response("Could not check the Proof", { status: 502 });
        }
      },
    },
  },
});
