import { STARTER_PLANS } from "#/content/starter-plans";
import { filterStarterPlans, type StarterPlanFilter } from "#/domain/starter-plans";

// Every Starter Plan that matches the filter, those that fit the Child's age first.
export function starterPlansFor(age: number, filter: StarterPlanFilter = {}) {
  return filterStarterPlans(STARTER_PLANS, age, filter);
}
