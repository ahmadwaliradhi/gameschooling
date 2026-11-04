import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "#/db";
import {
  answerVerdicts,
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
  giveReward,
  parentDecision,
  pointsForModelVerdict,
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
import { latestVerdict, offersFor, pointsBalance } from "./views";

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
  if (entries.length) {
    await db
      .insert(pointsLog)
      .values(entries.map((e) => ({ ...e, familyId, childId: quest.childId, verdictId })));
  }
  await settleStakeOf(db, {
    familyId,
    childId: quest.childId,
    verdictId,
    bonus: stake,
    outcome: stakeOutcome,
  });
  if (outcome === "accepted") {
    await db
      .update(quests)
      .set({ status: "done" })
      .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)));
  }
  return { verdictId, outcome };
}

const LEARNING: PointsKind[] = ["earned", "overrule"];
const STAKE: PointsKind[] = ["stake_won", "stake_lost"];

// Writes the Points entries that bring this Verdict's Stake in line with its outcome.
async function settleStakeOf(
  db: Db,
  input: { familyId: string; childId: string; verdictId: string; bonus: number | null; outcome: Outcome },
) {
  const { familyId, childId, verdictId, bonus, outcome } = input;
  if (bonus === null) return;
  const settled = await db
    .select({ kind: pointsLog.kind, amount: pointsLog.amount })
    .from(pointsLog)
    .where(
      and(
        eq(pointsLog.verdictId, verdictId),
        eq(pointsLog.familyId, familyId),
        inArray(pointsLog.kind, STAKE),
      ),
    );
  const entries = settleStake({ bonus, outcome, settled });
  if (entries.length) {
    await db.insert(pointsLog).values(entries.map((e) => ({ ...e, familyId, childId, verdictId })));
  }
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

// What this Verdict has already moved into the balance for learning (Stakes apart).
async function paidFor(db: Db, familyId: string, verdictId: string) {
  return balance(
    await db
      .select({ kind: pointsLog.kind, amount: pointsLog.amount })
      .from(pointsLog)
      .where(
        and(
          eq(pointsLog.verdictId, verdictId),
          eq(pointsLog.familyId, familyId),
          inArray(pointsLog.kind, LEARNING),
        ),
      ),
  );
}

async function applyDecision(
  db: Db,
  row: Decidable,
  d: { parentId: string; outcome: Outcome; entries: PointsEntry[]; stakeOutcome: Outcome },
) {
  const { familyId, id: verdictId } = row.verdict;
  const childId = row.quest.childId;
  await db
    .update(verdicts)
    .set({ outcome: d.outcome, decidedBy: d.parentId, decidedAt: new Date() })
    .where(and(eq(verdicts.id, verdictId), eq(verdicts.familyId, familyId)));
  if (d.entries.length) {
    await db.insert(pointsLog).values(d.entries.map((e) => ({ ...e, familyId, childId, verdictId })));
  }
  await settleStakeOf(db, { familyId, childId, verdictId, bonus: row.stakeBonus, outcome: d.stakeOutcome });
  if (row.quest.status !== "deleted") {
    await db
      .update(quests)
      .set({ status: d.outcome === "accepted" ? "done" : "open" })
      .where(and(eq(quests.id, row.quest.id), eq(quests.familyId, familyId)));
  }
}

// A worksheet's Verdict follows its answers: Points move by the change in the accepted share.
async function rescoreWorksheet(db: Db, row: Decidable, parentId: string) {
  const { familyId, id: verdictId } = row.verdict;
  const answers = await db.query.answerVerdicts.findMany({
    where: and(eq(answerVerdicts.verdictId, verdictId), eq(answerVerdicts.familyId, familyId)),
  });
  const total = worksheetVerdict(
    answers.map((a) => a.outcome),
    row.quest.points,
  );
  const delta = total.points - (await paidFor(db, familyId, verdictId));
  // Deciding a waiting worksheet is the first decision; changing a decided one is an overrule.
  const kind = row.verdict.outcome === "needs_parent" ? "earned" : "overrule";
  await applyDecision(db, row, {
    parentId,
    outcome: total.outcome,
    entries: delta === 0 || total.outcome === "needs_parent" ? [] : [{ kind, amount: delta }],
    stakeOutcome: total.stakeOutcome,
  });
}

export async function decideAsParent(
  db: Db,
  input: { familyId: string; parentId: string; verdictId: string; choice: ParentChoice },
) {
  const { familyId, verdictId, parentId } = input;
  const row = await decidable(db, familyId, verdictId);
  const outcome: Outcome = input.choice === "accept" ? "accepted" : "not_yet";
  const answers = await db.query.answerVerdicts.findMany({
    where: and(eq(answerVerdicts.verdictId, verdictId), eq(answerVerdicts.familyId, familyId)),
  });
  if (answers.length) {
    // On a worksheet, deciding the whole page decides every answer.
    await db
      .update(answerVerdicts)
      .set({ outcome, decidedBy: parentId, decidedAt: new Date() })
      .where(and(eq(answerVerdicts.verdictId, verdictId), eq(answerVerdicts.familyId, familyId)));
    await rescoreWorksheet(db, row, parentId);
    return;
  }
  const paid = await paidFor(db, familyId, verdictId);
  const decision = parentDecision(
    { outcome: row.verdict.outcome, paid, points: row.quest.points },
    input.choice,
  );
  await applyDecision(db, row, { parentId, ...decision, stakeOutcome: decision.outcome });
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
  const row = await decidable(db, familyId, answer.verdictId);
  await db
    .update(answerVerdicts)
    .set({
      outcome: input.choice === "accept" ? "accepted" : "not_yet",
      decidedBy: parentId,
      decidedAt: new Date(),
    })
    .where(and(eq(answerVerdicts.id, answer.id), eq(answerVerdicts.familyId, familyId)));
  await rescoreWorksheet(db, row, parentId);
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
  const entry = giveReward(await pointsBalance(db, input.familyId, input.childId), reward);
  await db.insert(pointsLog).values({
    ...entry,
    familyId: input.familyId,
    childId: input.childId,
    rewardName: reward.name,
  });
}
