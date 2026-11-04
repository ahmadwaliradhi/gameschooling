import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "#/db/schema";
import type { Db } from "#/db";
import type { ModelClient } from "#/models/client";
import type { Blobs, Deps } from "#/services/deps";
import { addChild, ensureFamily, savePlan } from "#/services/family";

// `beforeStatement` runs before each SQL statement and may hold it back, so a test can line up
// concurrent requests in the order that breaks them.
export async function testDb(
  opts: { beforeStatement?: (sql: string) => Promise<void> | void } = {},
): Promise<Db> {
  const client = createClient({ url: ":memory:" });
  const execute = client.execute.bind(client);
  const hook = opts.beforeStatement;
  if (hook) {
    client.execute = (async (stmt: Parameters<typeof execute>[0]) => {
      await hook(typeof stmt === "string" ? stmt : (stmt as { sql: string }).sql);
      return execute(stmt);
    }) as typeof client.execute;
  }
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "migrations" });
  return db as unknown as Db;
}

export function fakeClient(handlers: Partial<ModelClient>): ModelClient {
  const missing = (name: string) => () => Promise.reject(new Error(`unexpected ${name} call`));
  return {
    respond: handlers.respond ?? missing("respond"),
    chat: handlers.chat ?? missing("chat"),
    image: handlers.image ?? missing("image"),
    segment: handlers.segment ?? missing("segment"),
    transcribe: handlers.transcribe ?? missing("transcribe"),
  };
}

export function memoryBlobs(): Blobs & { keys: () => string[] } {
  const store = new Map<string, { bytes: Uint8Array; contentType: string }>();
  return {
    put: async (key, bytes, contentType) => void store.set(key, { bytes, contentType }),
    get: async (key) => store.get(key) ?? null,
    delete: async (key) => void store.delete(key),
    keys: () => [...store.keys()],
  };
}

export const usage = { inputTokens: 100, outputTokens: 50 };
export const json = (value: unknown, model = "muse-spark-1.3") => ({
  text: JSON.stringify(value),
  usage,
  model,
});

let users = 0;
export async function familyWithChild(
  db: Db,
  child: { nickname: string; birthYear: number } = {
    nickname: "Kiki",
    birthYear: new Date().getFullYear() - 6,
  },
  planText = "Counting to 20 in Indonesian. No fantasy creatures. Rewards: ice cream = 100, park = 40",
) {
  const userId = `user-${++users}`;
  await db.insert(schema.user).values({
    id: userId,
    name: "Parent",
    email: `${userId}@example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const parent = await ensureFamily(db, userId);
  const childId = await addChild(db, parent.familyId, child);
  await savePlan(db, parent.familyId, childId, planText);
  return { ...parent, childId };
}

export function deps(db: Db, client: ModelClient, blobs = memoryBlobs()): Deps {
  return {
    db,
    client,
    blobs,
    config: { plannerModel: "muse-wonder-1.0", plannerFallback: "muse-spark-1.3" },
  };
}

// A ready Quest for tests that start after Make quests. Defaults to a photo Quest worth 12 Points.
export async function questFor(
  db: Db,
  familyId: string,
  childId: string,
  q: Partial<typeof schema.quests.$inferInsert> = {},
) {
  const id = crypto.randomUUID();
  await db.insert(schema.quests).values({
    id,
    familyId,
    childId,
    title: "Count leaves",
    readAloud: "Find three leaves and take a photo!",
    proofKind: "photo",
    lookFor: [{ phrase: "leaf", count: 3 }],
    answer: "three leaves",
    points: 12,
    coverColor: "#F6D365",
    ...q,
  });
  return id;
}

export async function rewardFor(db: Db, familyId: string, childId: string, name: string, price: number) {
  await db.insert(schema.rewards).values({ familyId, childId, name, price });
}
