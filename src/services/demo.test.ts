import { describe, expect, it } from "vitest";
import { memoryBlobs, testDb } from "#/test/harness";
import { DEMO_FAMILY_ID, seedDemo } from "./demo";
import { parentView, sidebar } from "./views";

describe("seedDemo", () => {
  it("leaves photo Proofs without a photo when the demo blob is missing", async () => {
    const db = await testDb();
    const blobs = memoryBlobs();
    await blobs.put("demo/leaves.jpg", new Uint8Array([255, 216, 255]), "image/jpeg");
    await seedDemo(db, blobs);
    const keys: string[] = [];
    for (const child of await sidebar(db, DEMO_FAMILY_ID)) {
      for (const q of (await parentView(db, DEMO_FAMILY_ID, child.id)).quests) {
        if (q.verdict?.proof.photoKey) keys.push(q.verdict.proof.photoKey);
      }
    }
    expect(keys).toEqual(["demo/leaves.jpg"]);
  });
});
