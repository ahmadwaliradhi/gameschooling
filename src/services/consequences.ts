import { and, desc, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { consequences } from "#/db/schema";
import { getChild, parentNames } from "./family";

// Consequences are a Parent's decision with a reason. No model and no rule can create one, and they
// never write to the Points log.

export class ConsequenceError extends Error {}

export async function recordConsequence(
  db: Db,
  input: { familyId: string; parentId: string; childId: string; privilege: string; reason: string },
) {
  const privilege = input.privilege.trim();
  const reason = input.reason.trim();
  if (!privilege) throw new ConsequenceError("Name the privilege");
  if (!reason) throw new ConsequenceError("Give a reason");
  await getChild(db, input.familyId, input.childId);
  await db.insert(consequences).values({
    familyId: input.familyId,
    childId: input.childId,
    parentId: input.parentId,
    privilege,
    reason,
  });
}

// For Parents only, newest first.
export async function consequencesFor(db: Db, familyId: string, childId: string) {
  const rows = await db.query.consequences.findMany({
    where: and(eq(consequences.familyId, familyId), eq(consequences.childId, childId)),
    orderBy: desc(consequences.createdAt),
  });
  const names = await parentNames(db, familyId);
  return rows.map((c) => ({ ...c, parentName: names.get(c.parentId) ?? "A former Parent" }));
}
