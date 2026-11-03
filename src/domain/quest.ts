export type ProofKind = "photo" | "voice" | "text";

export const TYPING_AGE = 8;

export function proofKindFor(wanted: ProofKind, age: number): ProofKind {
  return wanted === "text" && age < TYPING_AGE ? "voice" : wanted;
}

export function questPoints(points: number): number {
  return Math.min(20, Math.max(5, Math.round(points)));
}

export function ageOf(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}
