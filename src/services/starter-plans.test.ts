import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { savePlan } from "./family";
import { starterPlansFor } from "./starter-plans";
import { parentView } from "./views";

describe("Starter Plans", () => {
  it("covers every approach the spec names", () => {
    const names = starterPlansFor(8).map((p) => p.name);
    for (const approach of [
      "Singapore Math",
      "Cambridge Primary",
      "Common Core",
      "Charlotte Mason",
      "Classical",
      "Quran and Arabic",
      "Kurikulum Merdeka",
    ]) {
      expect(names.some((n) => n.includes(approach))).toBe(true);
    }
  });

  it("puts the ones that fit the Child's age first", () => {
    const plans = starterPlansFor(5);
    const firstMiss = plans.findIndex((p) => !p.fits);
    expect(firstMiss).toBeGreaterThan(0);
    expect(plans.slice(firstMiss).every((p) => !p.fits)).toBe(true);
    expect(plans.filter((p) => p.fits).every((p) => p.minAge <= 5 && 5 <= p.maxAge)).toBe(true);
  });

  it("copies the text into the Child's Plan, and editing the copy leaves the Starter Plan alone", async () => {
    const db = await testDb();
    const { familyId, childId } = await familyWithChild(db);
    const [starter] = starterPlansFor(6);

    // The Plan box takes the Starter Plan text; Make quests saves it like typed text.
    await savePlan(db, familyId, childId, starter!.text);
    expect((await parentView(db, familyId, childId)).plan).toBe(starter!.text);

    await savePlan(db, familyId, childId, `${starter!.text}\nNo fantasy creatures.`);
    expect(starterPlansFor(6)[0]!.text).toBe(starter!.text);
  });
});
