import { describe, expect, it } from "vitest";
import { familyWithChild, testDb } from "#/test/harness";
import { savePlan } from "./family";
import { starterPlansFor } from "./starter-plans";
import { parentView } from "./views";

describe("Starter Plans", () => {
  it("covers every approach the Starter Plan research names", () => {
    const names = starterPlansFor(8).map((p) => p.name);
    for (const approach of [
      "Singapore Math",
      "Cambridge Primary",
      "Common Core",
      "Charlotte Mason",
      "Classical",
      "Quran and Arabic",
      "Kurikulum Merdeka",
      "Montessori",
      "Waldorf",
      "Reggio Emilia",
      "Unschooling",
      "Unit study",
      "Forest School",
      "Tinkering",
      "Mastery maths",
      "IB PYP",
      "England National Curriculum",
      "Australian Curriculum",
      "Finnish",
      "Japanese",
      "India Foundational",
      "Coding",
      "Money skills",
      "Feelings and friendship",
      "Everyday life skills",
      "Arts and music",
      "New language",
      "Catholic",
      "Bible and prayer",
      "Jewish",
      "Hindu",
      "Buddhist",
      "Sikh",
      "Seerah",
      "Akhlaq",
      "Wudu and salah",
      "SAT",
      "ACT",
      "AP",
      "Cambridge International A Level",
      "IB Diploma",
      "UTBK-SNBT",
      "Paket C",
      "NIOS",
      "SPM",
      "University application",
      "Life readiness",
    ]) {
      expect(names.some((n) => n.includes(approach))).toBe(true);
    }
  });

  it("labels every Starter Plan, and marks religion on exactly the faith plans", () => {
    const plans = starterPlansFor(8);
    expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length);
    for (const p of plans) {
      expect(p.minAge).toBeLessThanOrEqual(p.maxAge);
      expect(p.tags.includes("religion")).toBe(p.category === "faith");
      expect(p.lang).toMatch(/^[a-z]{2}$/);
    }
    expect(plans.find((p) => p.id === "quran-arabic")?.category).toBe("faith");
    expect(plans.find((p) => p.id === "kurikulum-merdeka")?.lang).toBe("id");
  });

  it("writes faith cover limits and method Reward choices into the text", () => {
    const text = (id: string) => starterPlansFor(8).find((p) => p.id === id)!.text;
    expect(text("islamic-seerah")).toMatch(/No pictures of the Prophet/);
    expect(text("sikh")).toMatch(/No pictures of the Gurus/);
    expect(text("hindu")).toMatch(/No pictures of deities/);
    for (const id of ["montessori", "unschooling", "buddhist"]) expect(text(id)).not.toMatch(/^Rewards:/m);
  });

  it("has at least one Starter Plan that fits every age from 3 to 18", () => {
    for (let age = 3; age <= 18; age++) {
      expect(starterPlansFor(age, { fitsOnly: true }).length, `age ${age}`).toBeGreaterThan(0);
    }
  });

  it("the University chip finds the test, route and application plans, not Life readiness", () => {
    const ids = starterPlansFor(17, { tags: ["university"] }).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["sat-prep", "utbk-snbt", "university-application"]));
    expect(ids).not.toContain("life-readiness");
  });

  it("writes the Indonesian plans in Indonesian and tags them Language", () => {
    for (const id of ["utbk-snbt", "paket-c-sekolahrumah"]) {
      const p = starterPlansFor(17).find((x) => x.id === id)!;
      expect(p.lang).toBe("id");
      expect(p.tags).toContain("language");
    }
  });

  it("puts the ones that fit the Child's age first", () => {
    const plans = starterPlansFor(5);
    const firstMiss = plans.findIndex((p) => !p.fits);
    expect(firstMiss).toBeGreaterThan(0);
    expect(plans.slice(firstMiss).every((p) => !p.fits)).toBe(true);
    expect(plans.filter((p) => p.fits).every((p) => p.minAge <= 5 && 5 <= p.maxAge)).toBe(true);
  });

  describe("filters", () => {
    it("by category keeps only that category", () => {
      const faith = starterPlansFor(8, { category: "faith" });
      expect(faith.length).toBeGreaterThan(0);
      expect(faith.every((p) => p.category === "faith")).toBe(true);
    });

    it("STEM matches stem and mixed plans, never non-stem; Non-STEM is the mirror", () => {
      const stem = starterPlansFor(8, { focus: "stem" });
      expect(stem.some((p) => p.focus === "stem")).toBe(true);
      expect(stem.some((p) => p.focus === "mixed")).toBe(true);
      expect(stem.some((p) => p.focus === "non-stem")).toBe(false);

      const nonStem = starterPlansFor(8, { focus: "non-stem" });
      expect(nonStem.some((p) => p.focus === "non-stem")).toBe(true);
      expect(nonStem.some((p) => p.focus === "mixed")).toBe(true);
      expect(nonStem.some((p) => p.focus === "stem")).toBe(false);
    });

    it("by two tags keeps only plans that carry both", () => {
      const both = starterPlansFor(8, { tags: ["outdoors", "arts"] });
      expect(both.map((p) => p.id)).toContain("charlotte-mason");
      expect(both.every((p) => p.tags.includes("outdoors") && p.tags.includes("arts"))).toBe(true);
    });

    it("fitsOnly hides plans outside the Child's age", () => {
      const fitting = starterPlansFor(3, { fitsOnly: true });
      expect(fitting.length).toBeLessThan(starterPlansFor(3).length);
      expect(fitting.every((p) => p.fits)).toBe(true);
    });

    it("with no filter is the same as the plain list, fitting first", () => {
      expect(starterPlansFor(5, {})).toEqual(starterPlansFor(5));
    });

    it("keeps fitting plans first when combined with a filter", () => {
      const plans = starterPlansFor(5, { category: "method" });
      const firstMiss = plans.findIndex((p) => !p.fits);
      if (firstMiss >= 0) expect(plans.slice(firstMiss).every((p) => !p.fits)).toBe(true);
    });
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
