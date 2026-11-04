import { env } from "cloudflare:workers";
import { d1Db } from "#/db";
import { httpModelClient } from "#/models/client";
import type { Deps } from "#/services/deps";
import { r2Blobs } from "./blobs";

export { r2Blobs };

export function db() {
  return d1Db(env.DB);
}

export function deps(): Deps {
  return {
    db: db(),
    client: httpModelClient({ modelApiKey: env.MODEL_API_KEY, basetenApiKey: env.BASETEN_API_KEY }),
    blobs: r2Blobs(env.BLOBS),
    config: { plannerModel: env.PLANNER_MODEL, plannerFallback: env.PLANNER_FALLBACK_MODEL },
  };
}
