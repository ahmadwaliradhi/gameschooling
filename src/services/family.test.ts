import { describe, expect, it } from "vitest";
import { families, parents, user } from "#/db/schema";
import { testDb } from "#/test/harness";
import { ensureFamily } from "./family";

describe("ensureFamily", () => {
  // A new Parent's first page load runs several loaders at once, each calling ensureFamily.
  it("gives a new Parent exactly one Family when called concurrently", async () => {
    const db = await testDb();
    await db.insert(user).values({
      id: "new-parent",
      name: "New",
      email: "new@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const results = await Promise.all([ensureFamily(db, "new-parent"), ensureFamily(db, "new-parent")]);

    expect(results[0]).toEqual(results[1]);
    expect(await db.select().from(parents)).toHaveLength(1);
    expect(await db.select().from(families)).toHaveLength(1);
  });
});
