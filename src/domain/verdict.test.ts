import { describe, expect, it } from "vitest";
import { decideOutcome } from "./verdict";

const pass = (confidence: number) => ({ decision: "pass" as const, confidence });
const fail = (confidence: number) => ({ decision: "fail" as const, confidence });

describe("decideOutcome", () => {
  it("accepts when both judges pass confidently", () => {
    expect(decideOutcome({ judges: [pass(0.9), pass(0.8)], recitation: false })).toBe("accepted");
  });

  it("says not yet when both judges fail confidently", () => {
    expect(decideOutcome({ judges: [fail(0.95), fail(0.7)], recitation: false })).toBe("not_yet");
  });

  it("sends disagreement to the Parent", () => {
    expect(decideOutcome({ judges: [pass(0.9), fail(0.9)], recitation: false })).toBe("needs_parent");
    expect(decideOutcome({ judges: [fail(0.9), pass(0.9)], recitation: false })).toBe("needs_parent");
  });

  it("treats 0.7 as confident and anything below as unsure", () => {
    expect(decideOutcome({ judges: [pass(0.7), pass(0.7)], recitation: false })).toBe("accepted");
    expect(decideOutcome({ judges: [pass(0.69), pass(0.99)], recitation: false })).toBe("needs_parent");
    expect(decideOutcome({ judges: [fail(0.99), fail(0.5)], recitation: false })).toBe("needs_parent");
  });

  it("always sends recitation and pronunciation to the Parent", () => {
    expect(decideOutcome({ judges: [pass(1), pass(1)], recitation: true })).toBe("needs_parent");
    expect(decideOutcome({ judges: [fail(1), fail(1)], recitation: true })).toBe("needs_parent");
  });
});
