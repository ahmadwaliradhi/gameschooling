import { describe, expect, it } from "vitest";
import { proofKindFor, questPoints, worksheetVerdict } from "./quest";

describe("Quest rules", () => {
  it("never asks a Child under 8 to type", () => {
    expect(proofKindFor("text", 6)).toBe("voice");
    expect(proofKindFor("photo", 6)).toBe("photo");
    expect(proofKindFor("text", 8)).toBe("text");
  });

  it("keeps Quest Points between 5 and 20", () => {
    expect(questPoints(2)).toBe(5);
    expect(questPoints(12.4)).toBe(12);
    expect(questPoints(99)).toBe(20);
  });
});

describe("Worksheet Proof", () => {
  it("is never chosen for a Child under 6", () => {
    expect(proofKindFor("worksheet", 5)).toBe("photo");
    expect(proofKindFor("worksheet", 6)).toBe("worksheet");
  });

  it("pays the Quest's Points in proportion to the answers accepted", () => {
    expect(worksheetVerdict(["accepted", "accepted", "not_yet"], 12)).toEqual({
      outcome: "accepted",
      points: 8,
      stakeOutcome: "not_yet",
    });
    expect(worksheetVerdict(["accepted", "accepted"], 12)).toEqual({
      outcome: "accepted",
      points: 12,
      stakeOutcome: "accepted",
    });
    expect(worksheetVerdict(["not_yet", "not_yet"], 12)).toEqual({
      outcome: "not_yet",
      points: 0,
      stakeOutcome: "not_yet",
    });
  });

  it("waits for the Parent while any answer does, or when no answer was found", () => {
    expect(worksheetVerdict(["accepted", "needs_parent"], 12)).toEqual({
      outcome: "needs_parent",
      points: 0,
      stakeOutcome: "needs_parent",
    });
    expect(worksheetVerdict([], 12).outcome).toBe("needs_parent");
  });
});
