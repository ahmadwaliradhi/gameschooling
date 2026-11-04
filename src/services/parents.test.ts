import { describe, expect, it } from "vitest";
import type { Db } from "#/db";
import { user } from "#/db/schema";
import { familyWithChild, testDb } from "#/test/harness";
import { ensureFamily } from "./family";
import { acceptInvite, createInvite, familyParents, ParentError, removeParent } from "./parents";
import { sidebar } from "./views";

let n = 0;
async function adult(db: Db, name = "Sara") {
  const id = `adult-${++n}`;
  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

describe("More than one Parent", () => {
  it("lets an invited adult join with their own sign-in as an equal Parent", async () => {
    const db = await testDb();
    const { familyId, parentId } = await familyWithChild(db);
    const { token } = await createInvite(db, { familyId, parentId });
    const sara = await adult(db);
    // Signing in first gives Sara an empty Family of her own; joining replaces it.
    await ensureFamily(db, sara);

    const joined = await acceptInvite(db, { userId: sara, token });

    expect(joined.familyId).toBe(familyId);
    expect((await ensureFamily(db, sara)).familyId).toBe(familyId);
    expect((await sidebar(db, familyId)).map((c) => c.nickname)).toEqual(["Kiki"]);
    expect((await familyParents(db, familyId)).map((p) => p.name).sort()).toEqual(["Parent", "Sara"]);
  });

  it("uses each invite once and only for seven days", async () => {
    const db = await testDb();
    const { familyId, parentId } = await familyWithChild(db);
    const now = new Date();
    const once = await createInvite(db, { familyId, parentId, now });
    await acceptInvite(db, { userId: await adult(db), token: once.token, now });

    await expect(
      acceptInvite(db, { userId: await adult(db), token: once.token, now }),
    ).rejects.toBeInstanceOf(ParentError);
    const old = await createInvite(db, { familyId, parentId, now });
    const eightDays = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    await expect(
      acceptInvite(db, { userId: await adult(db), token: old.token, now: eightDays }),
    ).rejects.toBeInstanceOf(ParentError);
  });

  it("will not move a Parent away from Children of their own", async () => {
    const db = await testDb();
    const a = await familyWithChild(db);
    const b = await familyWithChild(db);
    const { token } = await createInvite(db, { familyId: a.familyId, parentId: a.parentId });
    const [bParent] = await familyParents(db, b.familyId);

    await expect(acceptInvite(db, { userId: bParent!.userId, token })).rejects.toBeInstanceOf(ParentError);
  });

  it("lets a Parent remove another Parent, but never the last one", async () => {
    const db = await testDb();
    const { familyId, parentId } = await familyWithChild(db);
    const { token } = await createInvite(db, { familyId, parentId });
    const sara = await adult(db);
    const joined = await acceptInvite(db, { userId: sara, token });

    await removeParent(db, { familyId, parentId: joined.parentId });
    expect((await familyParents(db, familyId)).map((p) => p.name)).toEqual(["Parent"]);
    await expect(removeParent(db, { familyId, parentId })).rejects.toBeInstanceOf(ParentError);
  });
});
