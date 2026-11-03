import { createFileRoute } from "@tanstack/react-router";
import { deps } from "#/server/deps";
import { requireParent, SignedOutError } from "#/server/session";
import { checkProof, type ProofInput } from "#/services/check-proof";
import { NotFoundError } from "#/services/deps";

const MAX_BYTES = 12 * 1024 * 1024;

export const Route = createFileRoute("/api/proof")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { familyId } = await requireParent(request.headers);
          const form = await request.formData();
          const questId = String(form.get("questId") ?? "");
          const kind = String(form.get("kind") ?? "");
          let proof: ProofInput;
          if (kind === "text") {
            proof = { kind, text: String(form.get("text") ?? "").slice(0, 5000) };
          } else {
            const file = form.get("file");
            if (!(file instanceof File) || file.size > MAX_BYTES)
              return new Response("Bad file", { status: 400 });
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (kind === "photo") proof = { kind, bytes, contentType: file.type || "image/jpeg" };
            else if (kind === "voice") proof = { kind, wav: bytes };
            else return new Response("Bad kind", { status: 400 });
          }
          return Response.json(await checkProof(deps(), { familyId, questId, proof }));
        } catch (e) {
          if (e instanceof SignedOutError) return new Response("Signed out", { status: 401 });
          if (e instanceof NotFoundError) return new Response(e.message, { status: 404 });
          console.error(e);
          return new Response("Could not check the Proof", { status: 502 });
        }
      },
    },
  },
});
