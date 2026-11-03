import { and, eq } from "drizzle-orm";
import type { Db } from "#/db";
import { children, families, parents, plans, quests } from "#/db/schema";
import { NotFoundError } from "./deps";

// A Parent signing in for the first time gets a Family.
export async function ensureFamily(db: Db, userId: string): Promise<{ familyId: string; parentId: string }> {
  const existing = await db.query.parents.findFirst({ where: eq(parents.userId, userId) });
  if (existing) return { familyId: existing.familyId, parentId: existing.id };
  const familyId = crypto.randomUUID();
  const parentId = crypto.randomUUID();
  await db.insert(families).values({ id: familyId });
  await db.insert(parents).values({ id: parentId, familyId, userId });
  return { familyId, parentId };
}

export async function addChild(
  db: Db,
  familyId: string,
  child: { nickname: string; birthYear: number },
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .insert(children)
    .values({ id, familyId, nickname: child.nickname.trim(), birthYear: child.birthYear });
  await db.insert(plans).values({ familyId, childId: id, text: "" });
  return id;
}

export async function updateChild(
  db: Db,
  familyId: string,
  childId: string,
  child: { nickname: string; birthYear: number },
) {
  await db
    .update(children)
    .set({ nickname: child.nickname.trim(), birthYear: child.birthYear })
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
