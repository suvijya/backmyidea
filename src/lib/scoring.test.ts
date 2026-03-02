import { describe, it, expect } from "vitest";
import { calculateValidationScore, getScoreTier } from "./scoring";

describe("Scoring Logic", () => {
  it("returns EARLY_DAYS and 0 score if votes < 10", () => {
    const result = calculateValidationScore({
      totalVotes: 9,
      useThisCount: 9,
      maybeCount: 0,
      notForMeCount: 0,
      totalComments: 0,
      totalViews: 0,
      totalShares: 0,
      qualityScore: 100,
    });
    
    expect(result.totalScore).toBe(0);
    expect(result.tier).toBe("EARLY_DAYS");
  });

  it("calculates correct tier", () => {
    expect(getScoreTier(10)).toBe("EARLY_DAYS");
    expect(getScoreTier(30)).toBe("GETTING_NOTICED");
    expect(getScoreTier(50)).toBe("INTERESTED");
    expect(getScoreTier(70)).toBe("STRONG");
    expect(getScoreTier(90)).toBe("CROWD_FAVORITE");
  });
});
