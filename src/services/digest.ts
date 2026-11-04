import { and, desc, eq, gte, lt } from "drizzle-orm";
import type { Db } from "#/db";
import { children, digests, families, proofs, quests, verdicts, type DigestEntry } from "#/db/schema";
import { weekStart } from "#/domain/family-rules";
import { ageOf } from "#/domain/quest";
import { writeDigestText, type WeekOfChild } from "#/models/digest";
import { callContext, type Deps } from "./deps";
import { weekKey } from "./family-goal";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// The week's Proofs and Verdicts, per Child.
async function weekOf(db: Db, familyId: string, start: Date): Promise<WeekOfChild[]> {
  const rows = await db
    .select({ quest: quests, verdict: verdicts, child: children })
    .from(verdicts)
    .innerJoin(proofs, eq(proofs.id, verdicts.proofId))
    .innerJoin(quests, eq(quests.id, proofs.questId))
    .innerJoin(children, eq(children.id, quests.childId))
    .where(
      and(
        eq(verdicts.familyId, familyId),
        eq(proofs.familyId, familyId),
        gte(proofs.createdAt, start),
        lt(proofs.createdAt, new Date(start.getTime() + WEEK_MS)),
      ),
    );
  const byChild = new Map<string, WeekOfChild>();
  for (const r of rows) {
    const entry = byChild.get(r.child.id) ?? {
      childId: r.child.id,
      age: ageOf(r.child.birthYear, start),
      quests: [],
    };
    entry.quests.push({
      title: r.quest.title,
      answer: r.quest.answer,
      verdictId: r.verdict.id,
      outcome: r.verdict.outcome,
      reasons: r.verdict.judges.map((j) => j.reason),
    });
    byChild.set(r.child.id, entry);
  }
  return [...byChild.values()];
}

// One Digest for the Family's week that contains `week`. Skipped when nothing happened, or when the
// week already has one.
export async function writeDigest(deps: Deps, input: { familyId: string; week: Date }) {
  const { db } = deps;
  const { familyId } = input;
  const start = weekStart(input.week);
  const week = weekKey(start);
  const done = await db.query.digests.findFirst({
    where: and(eq(digests.familyId, familyId), eq(digests.week, week)),
  });
  if (done) return;
  const kids = await weekOf(db, familyId, start);
  if (kids.length === 0) return;
  const runId = crypto.randomUUID();
  const out = await writeDigestText(callContext(deps, { familyId, runId }), { week, children: kids });
  // Only Children who had a week, and only Verdicts that are really theirs.
  const entries: DigestEntry[] = out.children.flatMap((c) => {
    const kid = kids.find((k) => k.childId === c.child_id);
    if (!kid) return [];
    const own = new Set(kid.quests.map((q) => q.verdictId));
    return [
      {
        childId: kid.childId,
        learned: c.learned,
        struggled: c.struggled,
        verdictIds: c.verdict_ids.filter((id) => own.has(id)),
      },
    ];
  });
  await db.insert(digests).values({ familyId, week, runId, entries }).onConflictDoNothing();
}

// The weekly cron: a Digest for every Family's week just ended.
export async function writeWeeklyDigests(deps: Deps, now = new Date()) {
  const lastWeek = new Date(weekStart(now).getTime() - WEEK_MS);
  const all = await deps.db.select({ id: families.id }).from(families);
  for (const { id } of all) {
    try {
      await writeDigest(deps, { familyId: id, week: lastWeek });
    } catch (e) {
      console.error(`Digest failed for Family ${id}`, e);
    }
  }
}

// Past Digests, newest first, with each Child's nickname for the Parent.
export async function digestsFor(db: Db, familyId: string) {
  const rows = await db.query.digests.findMany({
    where: eq(digests.familyId, familyId),
    orderBy: desc(digests.week),
  });
  const kids = await db.query.children.findMany({ where: eq(children.familyId, familyId) });
  const names = new Map(kids.map((k) => [k.id, k.nickname]));
  return rows.map((d) => ({
    ...d,
    entries: d.entries.map((e) => ({ ...e, nickname: names.get(e.childId) ?? "" })),
  }));
}
