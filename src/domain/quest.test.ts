import { describe, expect, it } from "vitest";
import { proofKindFor, questPoints } from "./quest";

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
