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
  const latest = new Map<string, typeof verdicts.$inferSelect & { proof: typeof proofs.$inferSelect }>();
  // D1 allows at most 100 bound parameters per query, so ask in chunks.
  for (let i = 0; i < questIds.length; i += 90) {
    const rows = await db
      .select({ verdict: verdicts, proof: proofs })
      .from(verdicts)
      .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
      .where(
        and(
          eq(verdicts.familyId, familyId),
          eq(proofs.familyId, familyId),
          inArray(proofs.questId, questIds.slice(i, i + 90)),
        ),
      )
      // created_at is in whole seconds, so insert order breaks ties.
      .orderBy(asc(proofs.createdAt), asc(sql`${proofs}.rowid`));
    for (const r of rows) latest.set(r.proof.questId, { ...r.verdict, proof: r.proof });
  }
  return latest;
}

export async function latestVerdict(db: Db, familyId: string, questId: string) {
  return (await latestVerdicts(db, familyId, [questId])).get(questId) ?? null;
}

export async function sidebar(db: Db, familyId: string) {
  const childRows = await db.query.children.findMany({
    where: eq(children.familyId, familyId),
    orderBy: asc(children.createdAt),
  });
  const live = await db
    .select({ id: quests.id, childId: quests.childId })
    .from(quests)
    .where(and(eq(quests.familyId, familyId), ne(quests.status, "deleted")));
  // Only the latest Verdict of a Quest is shown, so only it can be waiting for the Parent.
  const latest = await latestVerdicts(
    db,
    familyId,
    live.map((q) => q.id),
  );
  const waiting = live.filter((q) => latest.get(q.id)?.outcome === "needs_parent");
  const totals = await db
    .select({ childId: pointsLog.childId, total: sql<number>`sum(${pointsLog.amount})` })
    .from(pointsLog)
    .where(eq(pointsLog.familyId, familyId))
    .groupBy(pointsLog.childId);
  const waitingSet = new Set(waiting.map((w) => w.childId));
  return childRows.map((c) => ({
    ...c,
    points: Number(totals.find((t) => t.childId === c.id)?.total ?? 0),
    needsParent: waitingSet.has(c.id),
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

// What the Child sees on each Quest, from its latest Verdict.
export async function questStates(db: Db, familyId: string, questIds: string[]) {
  const latest = await latestVerdicts(db, familyId, questIds);
  return new Map(
    questIds.map((id) => {
      const outcome = latest.get(id)?.outcome;
      const state: ChildQuestState =
        outcome === "needs_parent" ? "waiting" : outcome === "not_yet" ? "try_again" : "open";
      return [id, state];
    }),
  );
}

export async function childView(db: Db, familyId: string, childId: string) {
  const child = await getChild(db, familyId, childId);
  const rows = await db.query.quests.findMany({
    where: and(eq(quests.familyId, familyId), eq(quests.childId, childId), eq(quests.status, "open")),
    orderBy: desc(quests.createdAt),
  });
  const states = await questStates(
    db,
    familyId,
    rows.map((q) => q.id),
  );
  const points = await pointsBalance(db, familyId, childId);
  return {
    child,
    points,
    nextReward: nextReward(points, await childRewards(db, familyId, childId)),
    quests: rows.map((q) => ({ ...q, state: states.get(q.id) ?? "open" })),
  };
}

export async function questForChild(db: Db, familyId: string, questId: string) {
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.familyId, familyId)),
  });
  if (!quest) return null;
  return { quest, verdict: await latestVerdict(db, familyId, questId) };
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
