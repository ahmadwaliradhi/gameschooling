import { and, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "#/db";
import { children, families, invites, parents, user } from "#/db/schema";
import { NotFoundError } from "./deps";

// All Parents of a Family are equal. Another adult joins through a single-use invite link.

export class ParentError extends Error {}

export const INVITE_DAYS = 7;

export async function createInvite(
  db: Db,
  input: { familyId: string; parentId: string; now?: Date },
): Promise<{ token: string; expiresAt: Date }> {
  const now = input.now ?? new Date();
  const token = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000);
  await db
    .insert(invites)
    .values({ id: token, familyId: input.familyId, createdBy: input.parentId, expiresAt });
  return { token, expiresAt };
}

// Makes the signed-in adult a Parent of the inviting Family. An empty Family they got by signing in
// is dropped; a Family with Children of its own is never left behind.
export async function acceptInvite(
  db: Db,
  input: { userId: string; token: string; now?: Date },
): Promise<{ familyId: string; parentId: string }> {
  const now = input.now ?? new Date();
  const invite = await db.query.invites.findFirst({
    where: and(eq(invites.id, input.token), isNull(invites.usedAt), gt(invites.expiresAt, now)),
  });
  if (!invite) throw new ParentError("This invite was used or has expired");
  const existing = await db.query.parents.findFirst({ where: eq(parents.userId, input.userId) });
  if (existing?.familyId === invite.familyId) return { familyId: invite.familyId, parentId: existing.id };
  if (existing) {
    const kids = await db.query.children.findFirst({ where: eq(children.familyId, existing.familyId) });
    const others = (await db.query.parents.findMany({ where: eq(parents.familyId, existing.familyId) }))
      .length;
    if (kids || others > 1) throw new ParentError("You are already a Parent in a Family with Children");
  }
  await db.update(invites).set({ usedAt: now }).where(eq(invites.id, invite.id));
  if (existing) {
    await db.update(parents).set({ familyId: invite.familyId }).where(eq(parents.id, existing.id));
    await db.delete(families).where(eq(families.id, existing.familyId));
    return { familyId: invite.familyId, parentId: existing.id };
  }
  const parentId = crypto.randomUUID();
  await db.insert(parents).values({ id: parentId, familyId: invite.familyId, userId: input.userId });
  return { familyId: invite.familyId, parentId };
}

export async function familyParents(db: Db, familyId: string) {
  return db
    .select({ id: parents.id, userId: parents.userId, name: user.name, email: user.email })
    .from(parents)
    .innerJoin(user, eq(user.id, parents.userId))
    .where(eq(parents.familyId, familyId));
}

// A Family never has zero Parents.
export async function removeParent(db: Db, input: { familyId: string; parentId: string }) {
  const all = await familyParents(db, input.familyId);
  if (!all.some((p) => p.id === input.parentId)) throw new NotFoundError("Parent not found");
  if (all.length <= 1) throw new ParentError("A Family needs at least one Parent");
  await db.delete(parents).where(and(eq(parents.id, input.parentId), eq(parents.familyId, input.familyId)));
}
