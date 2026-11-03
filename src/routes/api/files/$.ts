import { createFileRoute } from "@tanstack/react-router";
import { deps } from "#/server/deps";
import { requireParent, SignedOutError } from "#/server/session";
import { DEMO_FAMILY_ID } from "#/services/demo";

// Serves covers and photos from R2 to the Family that owns them.
export const Route = createFileRoute("/api/files/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        let familyId: string;
        try {
          ({ familyId } = await requireParent(request.headers));
        } catch (e) {
          if (e instanceof SignedOutError) return new Response("Signed out", { status: 401 });
          throw e;
        }
        const key = params._splat ?? "";
        const [prefix, owner] = key.split("/");
        const allowed = prefix === "demo" ? familyId === DEMO_FAMILY_ID : owner === familyId;
        if (!allowed) return new Response("Not found", { status: 404 });
        const object = await deps().blobs.get(key);
        if (!object) return new Response("Not found", { status: 404 });
        return new Response(object.bytes as BodyInit, {
          headers: { "Content-Type": object.contentType, "Cache-Control": "private, max-age=86400" },
        });
      },
    },
  },
});
