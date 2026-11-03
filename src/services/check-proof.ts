import { and, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { pointsLog, proofs, quests, rewards, verdicts, type JudgeRecord, type SamFinding } from "#/db/schema";
import {
  balance,
  giveReward,
  parentDecision,
  pointsForModelVerdict,
  type ParentChoice,
} from "#/domain/points";
import { ageOf } from "#/domain/quest";
import { decideOutcome, type Outcome } from "#/domain/verdict";
import { judge } from "#/models/judge";
import type { Evidence, JudgeInput } from "#/models/judging";
import { MODELS } from "#/models/ids";
import { secondJudge } from "#/models/second-judge";
import { segment } from "#/models/segmenter";
import { transcribe } from "#/models/transcriber";
import { callContext, NotFoundError, type Deps } from "./deps";
import { getChild } from "./family";
import { pointsBalance } from "./views";

export type ProofInput =
  | { kind: "photo"; bytes: Uint8Array; contentType: string }
  | { kind: "voice"; wav: Uint8Array }
  | { kind: "text"; text: string };

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
  const child = await getChild(db, familyId, quest.childId);
  const proofId = crypto.randomUUID();
  const verdictId = crypto.randomUUID();
  const ctx = callContext(deps, { familyId, runId: crypto.randomUUID(), questId, proofId, verdictId });

  let evidence: Evidence;
  let findings: SamFinding[] | null = null;
  let stored: Partial<typeof proofs.$inferInsert> = {};
  if (proof.kind === "photo") {
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
  await db.insert(proofs).values({ id: proofId, familyId, questId, kind: proof.kind, ...stored });

  const judgeInput: JudgeInput = {
    age: ageOf(child.birthYear),
    readAloud: quest.readAloud,
    answer: quest.answer,
    lookFor: quest.lookFor,
    evidence,
  };
  const first = judge(ctx, judgeInput).catch(() => null);
  const second = secondJudge(ctx, judgeInput, () => first.then((j) => j?.description ?? "")).catch(
    () => null,
  );
  const [a, b] = await Promise.all([first, second]);
  const judges: JudgeRecord[] = [
    ...(a
      ? [
          {
            model: MODELS.spark,
            decision: a.decision,
            confidence: a.confidence,
            reason: a.reason,
            textOnly: false,
          },
        ]
      : []),
    ...(b
      ? [
          {
            model: MODELS.sparkOpen,
            decision: b.decision,
            confidence: b.confidence,
            reason: b.reason,
            textOnly: b.textOnly,
          },
        ]
      : []),
  ];
  // A judge that failed leaves the decision to the Parent.
  const outcome: Outcome =
    judges.length === 2 ? decideOutcome({ judges, recitation: quest.recitation }) : "needs_parent";

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
  const entries = pointsForModelVerdict(outcome, quest.points);
  if (entries.length) {
    await db
      .insert(pointsLog)
      .values(entries.map((e) => ({ ...e, familyId, childId: quest.childId, verdictId })));
  }
  if (outcome === "accepted") await db.update(quests).set({ status: "done" }).where(eq(quests.id, questId));
  return { verdictId, outcome };
}

export async function decideAsParent(
  db: Db,
  input: { familyId: string; parentId: string; verdictId: string; choice: ParentChoice },
) {
  const { familyId, verdictId } = input;
  const [row] = await db
    .select({ verdict: verdicts, quest: quests })
    .from(verdicts)
    .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
    .innerJoin(quests, eq(quests.id, proofs.questId))
    .where(and(eq(verdicts.id, verdictId), eq(verdicts.familyId, familyId)));
  if (!row) throw new NotFoundError("Verdict not found");
  const paid = balance(
    await db.select({ amount: pointsLog.amount }).from(pointsLog).where(eq(pointsLog.verdictId, verdictId)),
  );
  const decision = parentDecision(
    { outcome: row.verdict.outcome, paid, points: row.quest.points },
    input.choice,
  );

  await db
    .update(verdicts)
    .set({ outcome: decision.outcome, decidedBy: input.parentId, decidedAt: new Date() })
    .where(eq(verdicts.id, verdictId));
  if (decision.entries.length) {
    await db
      .insert(pointsLog)
      .values(decision.entries.map((e) => ({ ...e, familyId, childId: row.quest.childId, verdictId })));
  }
  if (row.quest.status !== "deleted") {
    await db
      .update(quests)
      .set({ status: decision.outcome === "accepted" ? "done" : "open" })
      .where(eq(quests.id, row.quest.id));
  }
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
