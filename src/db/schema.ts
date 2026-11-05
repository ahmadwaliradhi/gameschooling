import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  // Family Goal: on by default; only shown with two or more Children.
  familyGoal: integer("family_goal", { mode: "boolean" }).notNull().default(true),
  // Parent PIN: optional, shared by every Parent, guards the Parent screens on a shared device.
  parentPinHash: text("parent_pin_hash"),
  parentPinFailures: integer("parent_pin_failures").notNull().default(0),
  parentPinPausedUntil: integer("parent_pin_paused_until", { mode: "timestamp_ms" }),
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
    // The Parent's Stakes switch; null means the default for the Child's age.
    stakes: integer("stakes", { mode: "boolean" }),
    siblingBoard: integer("sibling_board", { mode: "boolean" }).notNull().default(false),
    // Optional 4-digit PIN: salted SHA-256, never the PIN itself.
    pinHash: text("pin_hash"),
    pinFailures: integer("pin_failures").notNull().default(0),
    pinPausedUntil: integer("pin_paused_until", { mode: "timestamp_ms" }),
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

export type ProofKindColumn = "photo" | "voice" | "text" | "worksheet";
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
    // "dropped": failed the Guardian check twice; shown to the Parent only, with the reason.
    status: text("status").$type<"open" | "done" | "deleted" | "dropped">().notNull().default("open"),
    droppedReason: text("dropped_reason"),
    // The Stake the Child chose for their next Proof, if any.
    stakeMultiplier: real("stake_multiplier"),
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
    // Bonus Points at Stake on this Proof's Verdict.
    stakeBonus: integer("stake_bonus"),
    // Displayed photo size, for Worksheet Proof box prompts.
    photoWidth: integer("photo_width"),
    photoHeight: integer("photo_height"),
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
    // Set fresh by every Parent decision; null until the first. A decision claims the Verdict by
    // swapping the revision it read for its own, so two decisions at once cannot both apply.
    revision: text("revision"),
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
    kind: text("kind").$type<"earned" | "reward_given" | "overrule" | "stake_won" | "stake_lost">().notNull(),
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
  | "second_judge"
  | "guardian"
  | "worksheet_reader"
  | "digest";

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

// Worksheet Proof: one Verdict per answer found on the photo. The Proof's own Verdict sums them up.
export type AnswerBox = { x1: number; y1: number; x2: number; y2: number };

export const answerVerdicts = sqliteTable(
  "answer_verdicts",
  {
    id: id(),
    familyId: familyId(),
    verdictId: text("verdict_id")
      .notNull()
      .references(() => verdicts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    question: text("question").notNull(),
    // What the reader saw written; "" when it could not read it.
    reading: text("reading").notNull(),
    box: text("box", { mode: "json" }).$type<AnswerBox>().notNull(),
    judges: text("judges", { mode: "json" }).$type<JudgeRecord[]>().notNull(),
    modelOutcome: text("model_outcome").$type<Outcome>().notNull(),
    outcome: text("outcome").$type<Outcome>().notNull(),
    decidedBy: text("decided_by").notNull(),
    decidedAt: integer("decided_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("answer_verdicts_verdict").on(t.verdictId)],
);

// Recorded by a Parent only, never by a model. Never shown to Children; never touches Points.
export const consequences = sqliteTable(
  "consequences",
  {
    id: id(),
    familyId: familyId(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    privilege: text("privilege").notNull(),
    reason: text("reason").notNull(),
    parentId: text("parent_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("consequences_child").on(t.childId)],
);

// One per Family per week, keyed by the week's Monday ("YYYY-MM-DD").
export const familyGoals = sqliteTable(
  "family_goals",
  {
    id: id(),
    familyId: familyId(),
    week: text("week").notNull(),
    target: integer("target").notNull(),
    rewardName: text("reward_name").notNull(),
    givenAt: integer("given_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("family_goals_week").on(t.familyId, t.week)],
);

export type DigestEntry = { childId: string; learned: string; struggled: string; verdictIds: string[] };

export const digests = sqliteTable(
  "digests",
  {
    id: id(),
    familyId: familyId(),
    week: text("week").notNull(),
    runId: text("run_id").notNull(),
    entries: text("entries", { mode: "json" }).$type<DigestEntry[]>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("digests_week").on(t.familyId, t.week)],
);

// A single-use link that makes another adult an equal Parent of the Family.
export const invites = sqliteTable(
  "invites",
  {
    id: id(),
    familyId: familyId(),
    createdBy: text("created_by").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("invites_family").on(t.familyId)],
);
