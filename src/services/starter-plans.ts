import {
  STARTER_PLANS,
  type StarterPlan,
  type StarterPlanCategory,
  type StarterPlanTag,
} from "#/content/starter-plans";

// What the "Use a Starter Plan" dialog narrows the list by. Everything is optional; tags
// combine with AND; a focus of "stem" or "non-stem" also matches "mixed" plans.
export type StarterPlanFilter = {
  category?: StarterPlanCategory;
  focus?: "stem" | "non-stem";
  tags?: StarterPlanTag[];
  fitsOnly?: boolean;
};

export type MarkedStarterPlan = StarterPlan & { fits: boolean };

// Every Starter Plan that passes the filter, those that fit the Child's age first.
export function starterPlansFor(age: number, filter: StarterPlanFilter = {}) {
  const marked = STARTER_PLANS.map((p) => ({ ...p, fits: p.minAge <= age && age <= p.maxAge }));
  return filterStarterPlans(marked, filter);
}

// The same narrowing on an already-marked list, so the dialog can filter the plans it was sent.
export function filterStarterPlans(plans: MarkedStarterPlan[], filter: StarterPlanFilter) {
  const kept = plans.filter(
    (p) =>
      (!filter.category || p.category === filter.category) &&
      (!filter.focus || p.focus === filter.focus || p.focus === "mixed") &&
      (filter.tags ?? []).every((t) => p.tags.includes(t)) &&
      (!filter.fitsOnly || p.fits),
  );
  return [...kept.filter((p) => p.fits), ...kept.filter((p) => !p.fits)];
}
