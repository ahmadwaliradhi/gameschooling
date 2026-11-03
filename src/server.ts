import { createServerEntry, createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { d1Db } from "#/db";
import { r2Blobs } from "#/server/blobs";
import { seedDemo } from "#/services/demo";

// Start's default entry, plus the nightly cron.
const start = createServerEntry({ fetch: createStartHandler(defaultStreamHandler) });

export default {
  fetch: (request) => start.fetch(request),
  // Rebuild the Demo Family so judges find it clean.
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(
      seedDemo(d1Db(env.DB), r2Blobs(env.BLOBS)).catch((e) => {
        console.error("Demo re-seed failed", e);
        throw e;
      }),
    );
  },
} satisfies ExportedHandler<Env>;
