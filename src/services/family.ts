import { and, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { children, families, parents, plans, quests, user } from "#/db/schema";
import { NotFoundError } from "./deps";

// A Parent signing in for the first time gets a Family.
// A first page load runs several loaders at once, so two calls can race here:
// the loser's insert is skipped and it drops its empty Family and uses the winner's.
export async function ensureFamily(db: Db, userId: string): Promise<{ familyId: string; parentId: string }> {
  const existing = await db.query.parents.findFirst({ where: eq(parents.userId, userId) });
  if (existing) return { familyId: existing.familyId, parentId: existing.id };
  const familyId = crypto.randomUUID();
  await db.insert(families).values({ id: familyId });
  await db
    .insert(parents)
    .values({ id: crypto.randomUUID(), familyId, userId })
    .onConflictDoNothing({ target: parents.userId });
  const parent = await db.query.parents.findFirst({ where: eq(parents.userId, userId) });
  if (!parent) throw new Error("Parent row missing after insert");
  if (parent.familyId !== familyId) await db.delete(families).where(eq(families.id, familyId));
  return { familyId: parent.familyId, parentId: parent.id };
}

// Each Parent's display name by Parent id, to show who decided what.
export async function parentNames(db: Db, familyId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: parents.id, name: user.name })
    .from(parents)
    .innerJoin(user, eq(user.id, parents.userId))
    .where(eq(parents.familyId, familyId));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export type ChildFields = { nickname: string; birthYear: number };

export async function addChild(db: Db, familyId: string, child: ChildFields): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(children)
    .values({ id, familyId, nickname: child.nickname.trim(), birthYear: child.birthYear });
  await db.insert(plans).values({ familyId, childId: id, text: "" });
  return id;
}

export async function updateChild(db: Db, familyId: string, childId: string, child: ChildFields) {
  await db
    .update(children)
    .set({ nickname: child.nickname.trim(), birthYear: child.birthYear })
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)));
}

// The Parent's switches for one Child.
export async function setChildSettings(
  db: Db,
  familyId: string,
  childId: string,
  settings: { stakes?: boolean | null; siblingBoard?: boolean },
) {
  await getChild(db, familyId, childId);
  await db
    .update(children)
    .set(settings)
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)));
}

export async function removeChild(db: Db, familyId: string, childId: string) {
  await db.delete(children).where(and(eq(children.id, childId), eq(children.familyId, familyId)));
}

export async function getChild(db: Db, familyId: string, childId: string) {
  const child = await db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.familyId, familyId)),
  });
  if (!child) throw new NotFoundError("Child not found");
  return child;
}

export async function savePlan(db: Db, familyId: string, childId: string, text: string) {
  await getChild(db, familyId, childId);
  await db
    .update(plans)
    .set({ text, updatedAt: new Date() })
    .where(and(eq(plans.childId, childId), eq(plans.familyId, familyId)));
}

export async function getPlanText(db: Db, familyId: string, childId: string): Promise<string> {
  const plan = await db.query.plans.findFirst({
    where: and(eq(plans.childId, childId), eq(plans.familyId, familyId)),
  });
  return plan?.text ?? "";
}

export async function deleteQuest(db: Db, familyId: string, questId: string) {
  await db
    .update(quests)
    .set({ status: "deleted" })
    .where(and(eq(quests.id, questId), eq(quests.familyId, familyId)));
}
