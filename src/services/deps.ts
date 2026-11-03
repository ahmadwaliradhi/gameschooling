import type { Db } from "#/db";
import type { ModelClient } from "#/models/client";
import { modelCalls } from "#/db/schema";
import type { CallContext } from "#/models/log";

export interface Blobs {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

export type Deps = {
  db: Db;
  client: ModelClient;
  blobs: Blobs;
  config: { plannerModel: string; plannerFallback: string };
  pause: (ms: number) => Promise<void>;
};

export function callContext(
  deps: Deps,
  ids: Pick<CallContext, "familyId" | "runId" | "questId" | "proofId" | "verdictId">,
): CallContext {
  return {
    ...ids,
    client: deps.client,
    write: async (row) => void (await deps.db.insert(modelCalls).values(row)),
  };
}

export class NotFoundError extends Error {}
