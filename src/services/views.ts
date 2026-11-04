import { and, asc, desc, eq, getTableColumns, inArray, ne, or, sql } from "drizzle-orm";
import type { Db } from "#/db";
import {
  answerVerdicts,
  children,
  modelCalls,
  pointsLog,
  proofs,
  quests,
  rewards,
  verdicts,
} from "#/db/schema";
import { siblingBoard, stakeOffers, stakesAllowed, streak } from "#/domain/family-rules";
import { balance, nextReward } from "#/domain/points";
import { ageOf } from "#/domain/quest";
import { consequencesFor } from "./consequences";
import { getChild, getPlanText, parentNames } from "./family";
import { familyChildren, familyEntries, familyGoalView } from "./family-goal";

// Read models for screens. Everything is scoped by family_id.

// A Child as screens see it: the PIN's hash and its tries stay on the server.
function shown<C extends typeof children.$inferSelect>(c: C) {
  const { pinHash, pinFailures: _f, pinPausedUntil: _p, ...rest } = c;
  return { ...rest, hasPin: pinHash !== null };
}

export async function pointsBalance(db: Db, familyId: string, childId: string): Promise<number> {
  const rows = await db
    .select({ kind: pointsLog.kind, amount: pointsLog.amount })
    .from(pointsLog)
    .where(and(eq(pointsLog.familyId, familyId), eq(pointsLog.childId, childId)));
  return balance(rows);
}

// The Stakes a Child may choose on a Quest right now: none when Stakes are off for them.
export function offersFor(child: { birthYear: number; stakes: boolean | null }, quest: { points: number }) {
  return stakesAllowed({ age: ageOf(child.birthYear), stakes: child.stakes })
    ? stakeOffers(quest.points)
    : [];
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

// Worksheet answers by Verdict id, in the order they appear on the page.
async function answersOf(db: Db, familyId: string, verdictIds: string[]) {
  const byVerdict = new Map<string, (typeof answerVerdicts.$inferSelect)[]>();
  for (let i = 0; i < verdictIds.length; i += 90) {
    const rows = await db.query.answerVerdicts.findMany({
      where: and(
        eq(answerVerdicts.familyId, familyId),
        inArray(answerVerdicts.verdictId, verdictIds.slice(i, i + 90)),
      ),
      orderBy: asc(answerVerdicts.position),
    });
    for (const r of rows) byVerdict.set(r.verdictId, [...(byVerdict.get(r.verdictId) ?? []), r]);
  }
  return byVerdict;
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
    .select({
      childId: pointsLog.childId,
      kind: pointsLog.kind,
      amount: sql<number>`sum(${pointsLog.amount})`,
    })
    .from(pointsLog)
    .where(eq(pointsLog.familyId, familyId))
    .groupBy(pointsLog.childId, pointsLog.kind);
  const waitingSet = new Set(waiting.map((w) => w.childId));
  return childRows.map((c) => ({
    ...shown(c),
    points: balance(
      totals.filter((t) => t.childId === c.id).map((t) => ({ kind: t.kind, amount: Number(t.amount) })),
    ),
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
  const all = await db.query.quests.findMany({
    where: and(eq(quests.familyId, familyId), eq(quests.childId, childId), ne(quests.status, "deleted")),
    orderBy: desc(quests.createdAt),
  });
  const rows = all.filter((q) => q.status !== "dropped");
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
  const names = await parentNames(db, familyId);
  const who = (decidedBy: string) =>
    decidedBy === "models" ? null : (names.get(decidedBy) ?? "A former Parent");
  const answers = await answersOf(
    db,
    familyId,
    [...latest.values()].map((v) => v.id),
  );
  const withVerdicts = rows
    .map((q) => {
      const v = latest.get(q.id);
      return {
        ...q,
        verdict: v
          ? {
              ...v,
              decidedByName: who(v.decidedBy),
              answers: (answers.get(v.id) ?? []).map((a) => ({ ...a, decidedByName: who(a.decidedBy) })),
            }
          : null,
      };
    })
    .sort((a, b) => rank(a) - rank(b));
  return {
    child: shown(child),
    plan: await getPlanText(db, familyId, childId),
    quests: withVerdicts,
    // Quests the Guardian turned down twice, with its reason. Never shown to the Child.
    dropped: all.filter((q) => q.status === "dropped"),
    rewards: await childRewards(db, familyId, childId),
    points: await pointsBalance(db, familyId, childId),
    consequences: await consequencesFor(db, familyId, childId),
    // Every balance change, oldest first, so a Parent can trace it.
    // Each entry carries its Quest's title when it came from a Verdict, even one no longer shown.
    pointsLog: await db
      .select({ ...getTableColumns(pointsLog), questTitle: quests.title })
      .from(pointsLog)
      .leftJoin(verdicts, and(eq(verdicts.id, pointsLog.verdictId), eq(verdicts.familyId, familyId)))
      .leftJoin(proofs, and(eq(proofs.id, verdicts.proofId), eq(proofs.familyId, familyId)))
      .leftJoin(quests, and(eq(quests.id, proofs.questId), eq(quests.familyId, familyId)))
      .where(and(eq(pointsLog.familyId, familyId), eq(pointsLog.childId, childId)))
      .orderBy(asc(pointsLog.createdAt), asc(sql`${pointsLog}.rowid`)),
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
  const now = new Date();
  const entries = await familyEntries(db, familyId);
  const kids = await familyChildren(db, familyId, now);
  const names = new Map(kids.map((k) => [k.id, k.nickname]));
  const board = siblingBoard({ entries, children: kids, viewerId: childId, now });
  return {
    child: shown(child),
    points,
    streak: streak({
      entries: entries.filter((e) => e.childId === childId),
      age: ageOf(child.birthYear),
      now,
    }),
    familyGoal: await familyGoalView(db, familyId, now),
    siblingBoard: board?.map((r) => ({ ...r, nickname: names.get(r.childId) ?? "" })) ?? null,
    nextReward: nextReward(points, await childRewards(db, familyId, childId)),
    quests: rows.map((q) => ({ ...q, state: states.get(q.id) ?? "open" })),
  };
}

export async function questForChild(db: Db, familyId: string, questId: string) {
  const quest = await db.query.quests.findFirst({
    where: and(eq(quests.id, questId), eq(quests.familyId, familyId)),
  });
  if (!quest) return null;
  const child = await getChild(db, familyId, quest.childId);
  return {
    quest,
    verdict: await latestVerdict(db, familyId, questId),
    stakeOffers: quest.status === "open" ? offersFor(child, quest) : [],
  };
}

// The model log behind a Quest (its Make quests run), a Verdict (its Proof check) or a run (a Digest).
export async function modelLog(
  db: Db,
  familyId: string,
  of: { questId: string } | { verdictId: string } | { runId: string },
) {
  if ("runId" in of) {
    return db.query.modelCalls.findMany({
      where: and(eq(modelCalls.familyId, familyId), eq(modelCalls.runId, of.runId)),
      orderBy: asc(modelCalls.createdAt),
    });
  }
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
