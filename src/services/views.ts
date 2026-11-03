import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import type { Db } from "#/db";
import { children, modelCalls, pointsLog, proofs, quests, rewards, verdicts } from "#/db/schema";
import { balance, nextReward } from "#/domain/points";
import { getChild, getPlanText } from "./family";

// Read models for screens. Everything is scoped by family_id.

export async function pointsBalance(db: Db, familyId: string, childId: string): Promise<number> {
  const rows = await db
    .select({ amount: pointsLog.amount })
    .from(pointsLog)
    .where(and(eq(pointsLog.familyId, familyId), eq(pointsLog.childId, childId)));
  return balance(rows);
}

async function latestVerdicts(db: Db, familyId: string, questIds: string[]) {
  if (questIds.length === 0)
    return new Map<string, typeof verdicts.$inferSelect & { proof: typeof proofs.$inferSelect }>();
  const rows = await db
    .select({ verdict: verdicts, proof: proofs })
    .from(verdicts)
    .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
    .where(and(eq(verdicts.familyId, familyId), inArray(proofs.questId, questIds)))
    .orderBy(asc(proofs.createdAt));
  const latest = new Map<string, typeof verdicts.$inferSelect & { proof: typeof proofs.$inferSelect }>();
  for (const r of rows) latest.set(r.proof.questId, { ...r.verdict, proof: r.proof });
  return latest;
}

export async function sidebar(db: Db, familyId: string) {
  const kids = await db.query.children.findMany({
    where: eq(children.familyId, familyId),
    orderBy: asc(children.createdAt),
  });
  const waiting = await db
    .select({ childId: quests.childId })
    .from(verdicts)
    .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
    .innerJoin(quests, eq(quests.id, proofs.questId))
    .where(
      and(
        eq(verdicts.familyId, familyId),
        eq(verdicts.outcome, "needs_parent"),
        ne(quests.status, "deleted"),
      ),
    );
  const totals = await db
    .select({ childId: pointsLog.childId, total: sql<number>`sum(${pointsLog.amount})` })
    .from(pointsLog)
    .where(eq(pointsLog.familyId, familyId))
    .groupBy(pointsLog.childId);
  const waitingSet = new Set(waiting.map((w) => w.childId));
  return kids.map((k) => ({
    ...k,
    points: Number(totals.find((t) => t.childId === k.id)?.total ?? 0),
    needsParent: waitingSet.has(k.id),
  }));
}

export async function childRewards(db: Db, familyId: string, childId: string) {
  return db.query.rewards.findMany({
    where: and(eq(rewards.familyId, familyId), eq(rewards.childId, childId)),
    orderBy: asc(rewards.price),
  });
}

export async function parentView(db: Db, familyId: string, childId: string) {
  const child = await getChild(db, familyId, childId);
  const rows = await db.query.quests.findMany({
    where: and(eq(quests.familyId, familyId), eq(quests.childId, childId), ne(quests.status, "deleted")),
    orderBy: desc(quests.createdAt),
  });
  const latest = await latestVerdicts(
    db,
    familyId,
    rows.map((q) => q.id),
  );
  const rank = (q: (typeof rows)[number]) => {
    const v = latest.get(q.id);
    if (v?.outcome === "needs_parent") return 0;
    return q.status === "open" ? 1 : 2;
  };
  const withVerdicts = rows
    .map((q) => ({ ...q, verdict: latest.get(q.id) ?? null }))
    .sort((a, b) => rank(a) - rank(b));
  return {
    child,
    plan: await getPlanText(db, familyId, childId),
    quests: withVerdicts,
    rewards: await childRewards(db, familyId, childId),
    points: await pointsBalance(db, familyId, childId),
  };
}

export type ChildQuestState = "open" | "waiting" | "try_again";

export async function childView(db: Db, familyId: string, childId: string) {
  const child = await getChild(db, familyId, childId);
  const rows = await db.query.quests.findMany({
    where: and(eq(quests.familyId, familyId), eq(quests.childId, childId), eq(quests.status, "open")),
    orderBy: desc(quests.createdAt),
  });
  const latest = await latestVerdicts(
    db,
    familyId,
    rows.map((q) => q.id),
  );
  const points = await pointsBalance(db, familyId, childId);
  return {
    child,
    points,
    nextReward: nextReward(points, await childRewards(db, familyId, childId)),
    quests: rows.map((q) => {
      const outcome = latest.get(q.id)?.outcome;
      const state: ChildQuestState =
        outcome === "needs_parent" ? "waiting" : outcome === "not_yet" ? "try_again" : "open";
      return { ...q, state };
    }),
  };
}

export async function questForChild(db: Db, familyId: string, questId: string) {
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.familyId, familyId)),
  });
  if (!quest) return null;
  const latest = (await latestVerdicts(db, familyId, [questId])).get(questId) ?? null;
  return { quest, verdict: latest };
}

// The model log behind a Quest (its Make quests run) or a Verdict (its Proof check).
export async function modelLog(db: Db, familyId: string, of: { questId: string } | { verdictId: string }) {
  if ("verdictId" in of) {
    return db.query.modelCalls.findMany({
      where: and(eq(modelCalls.familyId, familyId), eq(modelCalls.verdictId, of.verdictId)),
      orderBy: asc(modelCalls.createdAt),
    });
  }
  const own = await db.query.modelCalls.findMany({
    where: and(eq(modelCalls.familyId, familyId), eq(modelCalls.questId, of.questId)),
  });
  const runIds = [...new Set(own.map((c) => c.runId))];
  if (runIds.length === 0) return [];
  return db.query.modelCalls.findMany({
    where: and(
      eq(modelCalls.familyId, familyId),
      inArray(modelCalls.runId, runIds),
      or(eq(modelCalls.questId, of.questId), eq(modelCalls.agent, "planner")),
    ),
    orderBy: asc(modelCalls.createdAt),
  });
}
