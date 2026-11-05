// The labels a Parent filters Starter Plans by, and the filter itself. Pure, so the dialog can run
// it in the browser on the Starter Plans the server already sent.

export const STARTER_PLAN_CATEGORIES = ["method", "curriculum", "subject", "faith"] as const;
export type StarterPlanCategory = (typeof STARTER_PLAN_CATEGORIES)[number];

// "mixed" is a broad week that clearly does both, so it shows under both STEM and Non-STEM.
export type StarterPlanFocus = "stem" | "non-stem" | "mixed";
export const STARTER_PLAN_FOCUS_CHIPS = ["stem", "non-stem"] as const;
export type StarterPlanFocusChip = (typeof STARTER_PLAN_FOCUS_CHIPS)[number];

export const STARTER_PLAN_TAGS = [
  "religion",
  "early-years",
  "language",
  "outdoors",
  "arts",
  "life-skills",
  "whole-week",
  "university", // prepares for university entrance: a test, a qualifying route, or the application itself
] as const;
export type StarterPlanTag = (typeof STARTER_PLAN_TAGS)[number];

// `religion` is a tag if and only if the category is `faith`. `lang` is the language the text is
// written in (BCP-47), not the `language` tag, which means the plan teaches a language or script.
export type StarterPlan = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  category: StarterPlanCategory;
  focus: StarterPlanFocus;
  tags: StarterPlanTag[];
  lang: string;
  text: string;
};

// What a Parent picks in the Starter Plans dialog. Tags combine with AND. A focus chip also keeps
// "mixed" Starter Plans, which do both.
export type StarterPlanFilter = {
  category?: StarterPlanCategory;
  focus?: StarterPlanFocusChip;
  tags?: StarterPlanTag[];
  fitsOnly?: boolean;
};

// Starter Plans that match the filter, those that fit the Child's age first, each group in
// catalog order.
export function filterStarterPlans<P extends StarterPlan>(
  plans: P[],
  age: number,
  filter: StarterPlanFilter = {},
): (P & { fits: boolean })[] {
  const { category, focus, tags = [], fitsOnly = false } = filter;
  const kept = plans
    .map((p) => ({ ...p, fits: p.minAge <= age && age <= p.maxAge }))
    .filter(
      (p) =>
        (!category || p.category === category) &&
        (!focus || p.focus === focus || p.focus === "mixed") &&
        tags.every((t) => p.tags.includes(t)) &&
        (!fitsOnly || p.fits),
    );
  return [...kept.filter((p) => p.fits), ...kept.filter((p) => !p.fits)];
}
