import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
const familyId = () =>
  text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" });

// Better Auth tables (names and columns follow its Drizzle adapter defaults).
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// GameSchooling tables. Every row carries family_id.
export const families = sqliteTable("families", {
  id: id(),
  createdAt: createdAt(),
});

export const parents = sqliteTable("parents", {
  id: id(),
  familyId: familyId(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const children = sqliteTable(
  "children",
  {
    id: id(),
    familyId: familyId(),
    nickname: text("nickname").notNull(),
    birthYear: integer("birth_year").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("children_family").on(t.familyId)],
);

export const plans = sqliteTable("plans", {
  id: id(),
  familyId: familyId(),
  childId: text("child_id")
    .notNull()
    .unique()
    .references(() => children.id, { onDelete: "cascade" }),
  text: text("text").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type ProofKindColumn = "photo" | "voice" | "text";
export type LookFor = { phrase: string; count: number };

export const quests = sqliteTable(
  "quests",
  {
    id: id(),
    familyId: familyId(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    readAloud: text("read_aloud").notNull(),
    proofKind: text("proof_kind").$type<ProofKindColumn>().notNull(),
    // SAM noun phrases and counts, for photo Proofs.
    lookFor: text("look_for", { mode: "json" }).$type<LookFor[]>().notNull().default([]),
    // Expected answer or rubric, for every kind.
    answer: text("answer").notNull(),
    // Recitation or pronunciation: always decided by a Parent.
    recitation: integer("recitation", { mode: "boolean" }).notNull().default(false),
    points: integer("points").notNull(),
    coverKey: text("cover_key"),
    coverColor: text("cover_color").notNull(),
    status: text("status").$type<"open" | "done" | "deleted">().notNull().default("open"),
    createdAt: createdAt(),
  },
  (t) => [index("quests_child").on(t.childId, t.status)],
);

export type TranscriptTurn = { speaker: string | null; text: string; startMs: number; endMs: number };

export const proofs = sqliteTable(
  "proofs",
  {
    id: id(),
    familyId: familyId(),
    questId: text("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ProofKindColumn>().notNull(),
    photoKey: text("photo_key"),
    transcript: text("transcript", { mode: "json" }).$type<TranscriptTurn[]>(),
    text: text("text"),
    createdAt: createdAt(),
  },
  (t) => [index("proofs_quest").on(t.questId)],
);

export type JudgeRecord = {
  model: string;
  decision: "pass" | "fail";
  confidence: number;
  reason: string;
  textOnly: boolean;
};
export type SamFinding = { phrase: string; wanted: number; found: number; raw: string };
export type Outcome = "accepted" | "not_yet" | "needs_parent";

export const verdicts = sqliteTable(
  "verdicts",
  {
    id: id(),
    familyId: familyId(),
    proofId: text("proof_id")
      .notNull()
      .unique()
      .references(() => proofs.id, { onDelete: "cascade" }),
    judges: text("judges", { mode: "json" }).$type<JudgeRecord[]>().notNull(),
    sam: text("sam", { mode: "json" }).$type<SamFinding[]>(),
    // What the models decided; kept when a Parent changes `outcome`.
    modelOutcome: text("model_outcome").$type<Outcome>().notNull(),
    outcome: text("outcome").$type<Outcome>().notNull(),
    // "models" or the deciding Parent's id.
    decidedBy: text("decided_by").notNull(),
    decidedAt: integer("decided_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("verdicts_family_outcome").on(t.familyId, t.outcome)],
);

export const rewards = sqliteTable(
  "rewards",
  {
    id: id(),
    familyId: familyId(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: integer("price").notNull(),
  },
  (t) => [index("rewards_child").on(t.childId)],
);

// Insert-only. Balance is the sum of `amount`.
export const pointsLog = sqliteTable(
  "points_log",
  {
    id: id(),
    familyId: familyId(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"earned" | "reward_given" | "overrule">().notNull(),
    amount: integer("amount").notNull(),
    verdictId: text("verdict_id").references(() => verdicts.id, { onDelete: "set null" }),
    rewardName: text("reward_name"),
    createdAt: createdAt(),
  },
  (t) => [index("points_child").on(t.childId)],
);

export type Agent =
  | "planner"
  | "writer"
  | "illustrator"
  | "segmenter"
  | "transcriber"
  | "judge"
  | "second_judge";

export const modelCalls = sqliteTable(
  "model_calls",
  {
    id: id(),
    familyId: familyId(),
    // Groups the calls of one Make quests press or one Proof check.
    runId: text("run_id").notNull(),
    questId: text("quest_id"),
    proofId: text("proof_id"),
    verdictId: text("verdict_id"),
    agent: text("agent").$type<Agent>().notNull(),
    model: text("model").notNull(),
    endpoint: text("endpoint").notNull(),
    inputSummary: text("input_summary").notNull(),
    output: text("output"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    costUsd: real("cost_usd"),
    latencyMs: integer("latency_ms").notNull(),
    status: text("status").$type<"ok" | "error">().notNull(),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("model_calls_run").on(t.runId), index("model_calls_proof").on(t.proofId)],
);
