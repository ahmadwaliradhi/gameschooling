import { describe, expect, it } from "vitest";
import { STARTER_PLAN_CATEGORIES, STARTER_PLAN_TAGS } from "#/domain/starter-plans";
import { familyWithChild, testDb } from "#/test/harness";
import { savePlan } from "./family";
import { starterPlansFor } from "./starter-plans";
import { parentView } from "./views";

const byId = (id: string) => starterPlansFor(8).find((p) => p.id === id)!;

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
      "India Foundational Stage",
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
      expect(
        names.some((n) => n.includes(approach)),
        approach,
      ).toBe(true);
    }
  });

  it("labels every Starter Plan consistently", () => {
    const plans = starterPlansFor(8);
    expect(plans).toHaveLength(47);
    expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length);
    for (const p of plans) {
      expect(p.minAge, p.id).toBeLessThanOrEqual(p.maxAge);
      expect(STARTER_PLAN_CATEGORIES, p.id).toContain(p.category);
      expect(["stem", "non-stem", "mixed"], p.id).toContain(p.focus);
      for (const t of p.tags) expect(STARTER_PLAN_TAGS, p.id).toContain(t);
      expect(p.tags.includes("religion"), p.id).toBe(p.category === "faith");
      expect(p.lang, p.id).toMatch(/^[a-z]{2,3}$/);
    }
    expect(byId("kurikulum-merdeka").lang).toBe("id");
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
      expect(byId(id).lang, id).toBe("id");
      expect(byId(id).tags, id).toContain("language");
    }
  });

  it("puts the ones that fit the Child's age first", () => {
    const plans = starterPlansFor(5);
    const firstMiss = plans.findIndex((p) => !p.fits);
    expect(firstMiss).toBeGreaterThan(0);
    expect(plans.slice(firstMiss).every((p) => !p.fits)).toBe(true);
    expect(plans.filter((p) => p.fits).every((p) => p.minAge <= 5 && 5 <= p.maxAge)).toBe(true);
  });

  it("with no filter, returns every Starter Plan", () => {
    expect(starterPlansFor(5, {})).toEqual(starterPlansFor(5));
    expect(starterPlansFor(5)).toHaveLength(47);
  });

  it("filters by category", () => {
    const faith = starterPlansFor(8, { category: "faith" });
    expect(faith).toHaveLength(10);
    expect(faith.every((p) => p.category === "faith")).toBe(true);
  });

  it("STEM shows STEM and broad Starter Plans, Non-STEM shows the mirror", () => {
    const stem = starterPlansFor(8, { focus: "stem" });
    expect(stem.some((p) => p.focus === "stem")).toBe(true);
    expect(stem.some((p) => p.focus === "mixed")).toBe(true);
    expect(stem.some((p) => p.focus === "non-stem")).toBe(false);

    const nonStem = starterPlansFor(8, { focus: "non-stem" });
    expect(nonStem.some((p) => p.focus === "non-stem")).toBe(true);
    expect(nonStem.some((p) => p.focus === "mixed")).toBe(true);
    expect(nonStem.some((p) => p.focus === "stem")).toBe(false);
  });

  it("keeps only Starter Plans that carry every chosen tag", () => {
    const plans = starterPlansFor(4, { tags: ["early-years", "outdoors"] });
    expect(plans.map((p) => p.id).sort()).toEqual(["charlotte-mason", "forest-school"]);
  });

  it("hides Starter Plans outside the Child's age when asked", () => {
    const plans = starterPlansFor(3, { fitsOnly: true });
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.every((p) => p.minAge <= 3 && 3 <= p.maxAge)).toBe(true);
    expect(plans.length).toBeLessThan(starterPlansFor(3).length);
  });

  it("still puts fitting Starter Plans first when filtered", () => {
    const plans = starterPlansFor(13, { category: "faith" });
    const firstMiss = plans.findIndex((p) => !p.fits);
    expect(firstMiss).toBeGreaterThan(0);
    expect(plans.slice(firstMiss).every((p) => !p.fits)).toBe(true);
  });

  it("states the limits faith and method Starter Plans need in their text", () => {
    expect(byId("islamic-seerah").text).toMatch(/No pictures of the Prophet/);
    expect(byId("sikh").text).toMatch(/No pictures of the Gurus/);
    expect(byId("hindu").text).toMatch(/No pictures of deities/);
    for (const id of ["montessori", "unschooling", "buddhist"]) {
      expect(byId(id).text, id).not.toMatch(/^Rewards:/m);
    }
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
