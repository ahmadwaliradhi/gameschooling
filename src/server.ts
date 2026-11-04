import { createServerEntry, createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { d1Db } from "#/db";
import { r2Blobs } from "#/server/blobs";
import { seedDemo } from "#/services/demo";
import { writeWeeklyDigests } from "#/services/digest";
import { deps } from "#/server/deps";

// Start's default entry, plus the crons.
// Matches the weekly cron in wrangler.jsonc.
const WEEKLY_DIGEST_CRON = "0 1 * * 1";

const start = createServerEntry({ fetch: createStartHandler(defaultStreamHandler) });

export default {
  fetch: (request) => start.fetch(request),
  async scheduled(controller, _env, ctx) {
    // Monday: a Weekly Digest for every Family's week just ended.
    if (controller.cron === WEEKLY_DIGEST_CRON) {
      ctx.waitUntil(writeWeeklyDigests(deps()));
      return;
    }
    // Nightly: rebuild the Demo Family so judges find it clean.
    ctx.waitUntil(
      seedDemo(d1Db(env.DB), r2Blobs(env.BLOBS)).catch((e) => {
        console.error("Demo re-seed failed", e);
        throw e;
      }),
    );
  },
} satisfies ExportedHandler<Env>;
