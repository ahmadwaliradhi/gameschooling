import { STARTER_PLANS } from "#/content/starter-plans";

// Every Starter Plan, those that fit the Child's age first.
export function starterPlansFor(age: number) {
  const marked = STARTER_PLANS.map((p) => ({ ...p, fits: p.minAge <= age && age <= p.maxAge }));
  return [...marked.filter((p) => p.fits), ...marked.filter((p) => !p.fits)];
}
