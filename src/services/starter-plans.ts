import type { Db } from "#/db";
import { STARTER_PLANS } from "#/content/starter-plans";
import { NotFoundError } from "./deps";
import { savePlan } from "./family";

// Every Starter Plan, those that fit the Child's age first.
export function starterPlansFor(age: number) {
  const marked = STARTER_PLANS.map((p) => ({ ...p, fits: p.minAge <= age && age <= p.maxAge }));
  return [...marked.filter((p) => p.fits), ...marked.filter((p) => !p.fits)];
}

// Copies the Starter Plan's text into the Child's Plan. No link is kept.
export async function applyStarterPlan(db: Db, familyId: string, childId: string, starterId: string) {
  const starter = STARTER_PLANS.find((p) => p.id === starterId);
  if (!starter) throw new NotFoundError("Starter Plan not found");
  await savePlan(db, familyId, childId, starter.text);
}
