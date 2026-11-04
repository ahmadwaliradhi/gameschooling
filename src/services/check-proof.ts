import { and, asc, count, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import type { Db } from "#/db";
import {
  answerVerdicts,
  children,
  pointsLog,
  proofs,
  quests,
  rewards,
  verdicts,
  type JudgeRecord,
  type SamFinding,
} from "#/db/schema";
import {
  balance,
  parentDecision,
  pointsForModelVerdict,
  RewardNotReachedError,
  type ParentChoice,
} from "#/domain/points";
import { settleStake, stakeBonus, type PointsEntry, type PointsKind } from "#/domain/family-rules";
import { ageOf, worksheetVerdict } from "#/domain/quest";
import type { Outcome } from "#/domain/verdict";
import type { Evidence } from "#/models/judging";
import { segment } from "#/models/segmenter";
import { transcribe } from "#/models/transcriber";
import { callContext, NotFoundError, type Deps } from "./deps";
import { getChild } from "./family";
import { judgePair } from "./judge-pair";
import { judgeWorksheet, type AnswerRow } from "./worksheet";
import { latestVerdict, offersFor } from "./views";

export type ProofInput =
  | { kind: "photo"; bytes: Uint8Array; contentType: string }
  | { kind: "voice"; wav: Uint8Array }
  | { kind: "text"; text: string }
  // One photo of a whole worksheet; width and height are its displayed size, for SAM box prompts.
  | { kind: "worksheet"; bytes: Uint8Array; contentType: string; width: number; height: number };

// The Proof's kind is not the one the Quest asks for (a 6-year-old is never asked to type).
export class ProofKindError extends Error {}
// The Quest's latest Verdict still waits for the Parent; another Proof would hide it.
export class WaitingForParentError extends Error {}

function dataUrl(bytes: Uint8Array, contentType: string) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

// Checks one Proof with the models and writes its Verdict. Points are paid only on `accepted`.
export async function checkProof(
  deps: Deps,
  input: { familyId: string; questId: string; proof: ProofInput },
): Promise<{ verdictId: string; outcome: Outcome }> {
  const { db } = deps;
  const { familyId, questId, proof } = input;
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.familyId, familyId), eq(quests.status, "open")),
  });
  if (!quest) throw new NotFoundError("Quest not found");
  if (proof.kind !== quest.proofKind) {
    throw new ProofKindError(`This Quest needs a ${quest.proofKind} Proof`);
  }
  if ((await latestVerdict(db, familyId, questId))?.outcome === "needs_parent") {
    throw new WaitingForParentError("This Quest is waiting for the Parent");
  }
  const child = await getChild(db, familyId, quest.childId);
  // A chosen Stake rides on this Proof only, and only if Stakes are still on for the Child.
  const stake =
    quest.stakeMultiplier !== null &&
    offersFor(child, quest).some((o) => o.multiplier === quest.stakeMultiplier)
      ? stakeBonus(quest.points, quest.stakeMultiplier)
      : null;
  if (quest.stakeMultiplier !== null) {
    await db
      .update(quests)
      .set({ stakeMultiplier: null })
      .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)));
  }
  const proofId = crypto.randomUUID();
  const verdictId = crypto.randomUUID();
  const ctx = callContext(deps, { familyId, runId: crypto.randomUUID(), questId, proofId, verdictId });

  const age = ageOf(child.birthYear);
  let evidence: Evidence | null = null;
  let findings: SamFinding[] | null = null;
  let stored: Partial<typeof proofs.$inferInsert> = {};
  let sheet: { imageUrl: string; width: number; height: number } | null = null;
  let judges: JudgeRecord[] = [];
  let answers: AnswerRow[] = [];
  let outcome: Outcome;
  let entries;
  let stakeOutcome: Outcome;
  try {
    if (proof.kind === "worksheet") {
      const photoKey = `proofs/${familyId}/${proofId}`;
      await deps.blobs.put(photoKey, proof.bytes, proof.contentType);
      sheet = { imageUrl: dataUrl(proof.bytes, proof.contentType), width: proof.width, height: proof.height };
      stored = { photoKey, photoWidth: proof.width, photoHeight: proof.height };
    } else if (proof.kind === "photo") {
      const photoKey = `proofs/${familyId}/${proofId}`;
      await deps.blobs.put(photoKey, proof.bytes, proof.contentType);
      const imageUrl = dataUrl(proof.bytes, proof.contentType);
      const results = await Promise.all(
        quest.lookFor.map(async (l) => {
          try {
            const r = await segment(ctx, { phrase: l.phrase, imageUrl });
            return { phrase: l.phrase, wanted: l.count, found: r.found, raw: r.raw };
          } catch {
            return null;
          }
        }),
      );
      findings = results.filter((f) => f !== null);
      evidence = { kind: "photo", imageUrl, findings };
      stored = { photoKey };
    } else if (proof.kind === "voice") {
      // The recording is passed straight through and never stored.
      const turns = await transcribe(ctx, proof.wav);
      evidence = { kind: "voice", turns };
      stored = { transcript: turns };
    } else {
      evidence = { kind: "text", text: proof.text };
      stored = { text: proof.text };
    }
    await db
      .insert(proofs)
      .values({ id: proofId, familyId, questId, kind: proof.kind, stakeBonus: stake, ...stored });

    if (sheet) {
      ({ answers, sam: findings } = await judgeWorksheet(ctx, { ...sheet, age, quest }));
      const total = worksheetVerdict(
        answers.map((a) => a.outcome),
        quest.points,
      );
      outcome = total.outcome;
      stakeOutcome = total.stakeOutcome;
      entries = pointsForModelVerdict(outcome, total.points);
    } else {
      const judgeInput = {
        age,
        readAloud: quest.readAloud,
        answer: quest.answer,
        lookFor: quest.lookFor,
        evidence: evidence!,
      };
      ({ judges, outcome } = await judgePair(ctx, judgeInput, quest.recitation));
      stakeOutcome = outcome;
      entries = pointsForModelVerdict(outcome, quest.points);
    }
  } catch (e) {
    // Judging failed before a Verdict: give the chosen Stake back so the retry still carries it.
    if (quest.stakeMultiplier !== null) {
      await db
        .update(quests)
        .set({ stakeMultiplier: quest.stakeMultiplier })
        .where(and(eq(quests.id, questId), eq(quests.familyId, familyId), isNull(quests.stakeMultiplier)));
    }
    throw e;
  }

  const now = new Date();
  await db.insert(verdicts).values({
    id: verdictId,
    familyId,
    proofId,
    judges,
    sam: findings,
    modelOutcome: outcome,
    outcome,
    decidedBy: "models",
    decidedAt: now,
  });
  if (answers.length) {
    await db.insert(answerVerdicts).values(answers.map((a) => ({ ...a, familyId, verdictId })));
  }
  // The models' Points step aside if a Parent has already decided this Verdict.
  const undecided = sql`exists (select 1 from ${verdicts} where ${verdicts.id} = ${verdictId} and ${verdicts.revision} is null)`;
  const stakeEntries =
    stake === null ? [] : settleStake({ bonus: stake, outcome: stakeOutcome, settled: [] });
  for (const e of [...entries, ...stakeEntries]) {
    await insertIf(db, { ...e, familyId, childId: quest.childId, verdictId }, undecided);
  }
  if (outcome === "accepted") {
    await db
      .update(quests)
      .set({ status: "done" })
      .where(and(eq(quests.id, questId), eq(quests.familyId, familyId), undecided));
  }
  return { verdictId, outcome };
}

const LEARNING: PointsKind[] = ["earned", "overrule"];
const STAKE: PointsKind[] = ["stake_won", "stake_lost"];

// Writes one Points entry only if `guard` still holds as it is written. Check and write are one
// statement, so a concurrent request cannot slip in between. Says whether the entry was written.
async function insertIf(
  db: Db,
  e: PointsEntry & { familyId: string; childId: string; verdictId?: string; rewardName?: string },
  guard: SQL,
): Promise<boolean> {
  const written = await db
    .insert(pointsLog)
    .select(
      db
        .select({
          id: sql<string>`${crypto.randomUUID()}`.as("id"),
          familyId: children.familyId,
          childId: children.id,
          kind: sql<PointsKind>`${e.kind}`.as("kind"),
          amount: sql<number>`${e.amount}`.as("amount"),
          verdictId: sql<string | null>`${e.verdictId ?? null}`.as("verdict_id"),
          rewardName: sql<string | null>`${e.rewardName ?? null}`.as("reward_name"),
          createdAt: sql<Date>`${Date.now()}`.as("created_at"),
        })
        .from(children)
        .where(and(eq(children.id, e.childId), eq(children.familyId, e.familyId), guard)),
    )
    .returning({ id: pointsLog.id });
  return written.length > 0;
}

type Decidable = {
  verdict: typeof verdicts.$inferSelect;
  quest: typeof quests.$inferSelect;
  stakeBonus: number | null;
};

// A Verdict a Parent may decide: in this Family, and the latest of its Quest. Deciding an older one
// would pay or move the Quest twice.
async function decidable(db: Db, familyId: string, verdictId: string): Promise<Decidable> {
  const [row] = await db
    .select({ verdict: verdicts, quest: quests, stakeBonus: proofs.stakeBonus })
    .from(verdicts)
    .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
    .innerJoin(quests, eq(quests.id, proofs.questId))
    .where(
      and(
        eq(verdicts.id, verdictId),
        eq(verdicts.familyId, familyId),
        eq(proofs.familyId, familyId),
        eq(quests.familyId, familyId),
      ),
    );
  if (!row || (await latestVerdict(db, familyId, row.quest.id))?.id !== verdictId) {
    throw new NotFoundError("Verdict not found");
  }
  return row;
}

// Two decisions on one Verdict can arrive at once (two tabs, two Parents). Each retries on a
// conflict, reading again, a few times before giving up.
const ATTEMPTS = 5;
export class DecisionConflictError extends Error {}

type Decision = { outcome: Outcome; entries: PointsEntry[]; stakeOutcome: Outcome };

// This Verdict's Points entries of these kinds, oldest first.
function entriesOf(db: Db, familyId: string, verdictId: string, kinds: PointsKind[]) {
  return db
    .select({ kind: pointsLog.kind, amount: pointsLog.amount })
    .from(pointsLog)
    .where(
      and(
        eq(pointsLog.verdictId, verdictId),
        eq(pointsLog.familyId, familyId),
        inArray(pointsLog.kind, kinds),
      ),
    )
    .orderBy(asc(pointsLog.createdAt), asc(sql`${pointsLog}.rowid`));
}

function entryCount(db: Db, familyId: string, verdictId: string) {
  return db
    .select({ n: count() })
    .from(pointsLog)
    .where(and(eq(pointsLog.verdictId, verdictId), eq(pointsLog.familyId, familyId)));
}

// Applies a Parent's decision, which `decideFrom` works out from the Verdict, its answers and what
// it has paid for learning so far.
//
// The decision first claims the Verdict: one update that swaps the revision it read for a new one,
// and only while the Verdict's Points entries still number what it read. A claim made from stale
// reads matches nothing, and the decision reads again. Every write after the claim is guarded on
// the new revision, so a later claim makes this decision's remaining writes step aside: the last
// claim always read everything the others wrote, and it alone finishes.
async function decide(
  db: Db,
  input: { familyId: string; verdictId: string; parentId: string },
  decideFrom: (row: Decidable, answers: AnswerOutcome[], paid: number) => Decision,
) {
  const { familyId, verdictId, parentId } = input;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const row = await decidable(db, familyId, verdictId);
    const answers = await db.query.answerVerdicts.findMany({
      columns: { outcome: true },
      where: and(eq(answerVerdicts.verdictId, verdictId), eq(answerVerdicts.familyId, familyId)),
    });
    const learning = await entriesOf(db, familyId, verdictId, LEARNING);
    const stakes = await entriesOf(db, familyId, verdictId, STAKE);
    const d = decideFrom(row, answers, balance(learning));

    const revision = crypto.randomUUID();
    const read = row.verdict.revision;
    const claimed = await db
      .update(verdicts)
      .set({ outcome: d.outcome, decidedBy: parentId, decidedAt: new Date(), revision })
      .where(
        and(
          eq(verdicts.id, verdictId),
          eq(verdicts.familyId, familyId),
          read === null ? isNull(verdicts.revision) : eq(verdicts.revision, read),
          sql`(${entryCount(db, familyId, verdictId)}) = ${learning.length + stakes.length}`,
        ),
      )
      .returning({ id: verdicts.id });
    if (!claimed.length) continue;

    const ours = sql`exists (select 1 from ${verdicts} where ${verdicts.id} = ${verdictId} and ${verdicts.revision} = ${revision})`;
    const childId = row.quest.childId;
    const stakeEntries =
      row.stakeBonus === null
        ? []
        : settleStake({ bonus: row.stakeBonus, outcome: d.stakeOutcome, settled: stakes });
    for (const e of [...d.entries, ...stakeEntries]) {
      await insertIf(db, { ...e, familyId, childId, verdictId }, ours);
    }
    if (row.quest.status !== "deleted") {
      await db
        .update(quests)
        .set({ status: d.outcome === "accepted" ? "done" : "open" })
        .where(and(eq(quests.id, row.quest.id), eq(quests.familyId, familyId), ours));
    }
    return;
  }
  throw new DecisionConflictError("The Verdict changed while it was being decided; try again");
}

type AnswerOutcome = { outcome: Outcome };

// A worksheet's Verdict follows its answers: Points move by the change in the accepted share.
function rescoreWorksheet(row: Decidable, answers: AnswerOutcome[], paid: number): Decision {
  const total = worksheetVerdict(
    answers.map((a) => a.outcome),
    row.quest.points,
  );
  const delta = total.points - paid;
  // Deciding a waiting worksheet is the first decision; changing a decided one is an overrule.
  const kind = row.verdict.outcome === "needs_parent" ? "earned" : "overrule";
  return {
    outcome: total.outcome,
    entries: delta === 0 || total.outcome === "needs_parent" ? [] : [{ kind, amount: delta }],
    stakeOutcome: total.stakeOutcome,
  };
}

export async function decideAsParent(
  db: Db,
  input: { familyId: string; parentId: string; verdictId: string; choice: ParentChoice },
) {
  const { familyId, verdictId, parentId } = input;
  await decidable(db, familyId, verdictId);
  const outcome: Outcome = input.choice === "accept" ? "accepted" : "not_yet";
  // On a worksheet, deciding the whole page decides every answer.
  await db
    .update(answerVerdicts)
    .set({ outcome, decidedBy: parentId, decidedAt: new Date() })
    .where(and(eq(answerVerdicts.verdictId, verdictId), eq(answerVerdicts.familyId, familyId)));
  await decide(db, input, (row, answers, paid) => {
    if (answers.length) return rescoreWorksheet(row, answers, paid);
    const d = parentDecision({ outcome: row.verdict.outcome, paid, points: row.quest.points }, input.choice);
    return { ...d, stakeOutcome: d.outcome };
  });
}

// A Parent decides one answer on a worksheet.
export async function decideAnswer(
  db: Db,
  input: { familyId: string; parentId: string; answerId: string; choice: ParentChoice },
) {
  const { familyId, parentId } = input;
  const answer = await db.query.answerVerdicts.findFirst({
    where: and(eq(answerVerdicts.id, input.answerId), eq(answerVerdicts.familyId, familyId)),
  });
  if (!answer) throw new NotFoundError("Answer not found");
  await decidable(db, familyId, answer.verdictId);
  await db
    .update(answerVerdicts)
    .set({
      outcome: input.choice === "accept" ? "accepted" : "not_yet",
      decidedBy: parentId,
      decidedAt: new Date(),
    })
    .where(and(eq(answerVerdicts.id, answer.id), eq(answerVerdicts.familyId, familyId)));
  await decide(db, { familyId, parentId, verdictId: answer.verdictId }, rescoreWorksheet);
}

export async function giveRewardTo(db: Db, input: { familyId: string; childId: string; rewardId: string }) {
  const reward = await db.query.rewards.findFirst({
    where: and(
      eq(rewards.id, input.rewardId),
      eq(rewards.familyId, input.familyId),
      eq(rewards.childId, input.childId),
    ),
  });
  if (!reward) throw new NotFoundError("Reward not found");
  // The balance check rides on the insert itself, so two Gives at once cannot both spend it.
  const given = await insertIf(
    db,
    { kind: "reward_given", amount: -reward.price, ...input, rewardName: reward.name },
    sql`(${balanceSql(input.familyId, input.childId)}) >= ${reward.price}`,
  );
  if (!given) throw new RewardNotReachedError(`${reward.name} needs ${reward.price} Points`);
}

// `balance` from #/domain/family-rules, in SQL: Stakes net to no less than zero.
function balanceSql(familyId: string, childId: string) {
  const stake = sql`${pointsLog.kind} in ('stake_won', 'stake_lost')`;
  return sql`select coalesce(sum(case when ${stake} then 0 else ${pointsLog.amount} end), 0)
    + max(0, coalesce(sum(case when ${stake} then ${pointsLog.amount} else 0 end), 0))
    from ${pointsLog} where ${pointsLog.familyId} = ${familyId} and ${pointsLog.childId} = ${childId}`;
}
