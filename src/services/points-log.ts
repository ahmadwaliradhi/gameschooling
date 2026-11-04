import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { Db } from "#/db";
import { children, pointsLog } from "#/db/schema";
import { STAKE_KINDS, type PointsEntry, type PointsKind } from "#/domain/family-rules";

// Writes to the insert-only Points log that must not race: each write carries its own check, so
// check and write are one statement and a concurrent request cannot slip in between.

export type PointsRow = PointsEntry & {
  familyId: string;
  childId: string;
  verdictId?: string;
  rewardName?: string;
};

// Writes one Points entry only if `guard` holds as it is written. Says whether it was written.
export async function insertPointsEntryIf(db: Db, row: PointsRow, guard: SQL): Promise<boolean> {
  const written = await db
    .insert(pointsLog)
    .select(
      db
        .select({
          id: sql<string>`${crypto.randomUUID()}`.as("id"),
          familyId: children.familyId,
          childId: children.id,
          kind: sql<PointsKind>`${row.kind}`.as("kind"),
          amount: sql<number>`${row.amount}`.as("amount"),
          verdictId: sql<string | null>`${row.verdictId ?? null}`.as("verdict_id"),
          rewardName: sql<string | null>`${row.rewardName ?? null}`.as("reward_name"),
          createdAt: sql<Date>`${Date.now()}`.as("created_at"),
        })
        .from(children)
        .where(and(eq(children.id, row.childId), eq(children.familyId, row.familyId), guard)),
    )
    .returning({ id: pointsLog.id });
  return written.length > 0;
}

// The Child's balance as SQL, for guards. It mirrors `balance` in #/domain/family-rules (Stakes
// net to no less than zero). The Stakes and Reward tests hold the two to the same answers.
export function balanceSql(familyId: string, childId: string): SQL {
  const isStake = inArray(pointsLog.kind, [...STAKE_KINDS]);
  return sql`(select coalesce(sum(case when ${isStake} then 0 else ${pointsLog.amount} end), 0)
    + max(0, coalesce(sum(case when ${isStake} then ${pointsLog.amount} else 0 end), 0))
    from ${pointsLog} where ${pointsLog.familyId} = ${familyId} and ${pointsLog.childId} = ${childId})`;
}
