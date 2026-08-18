import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, checkNewlyUnlockedAchievements, computeMaxSessionCombo, type AchievementFacts } from "./achievements";

function baseFacts(overrides: Partial<AchievementFacts> = {}): AchievementFacts {
  return {
    isFirstSession: false,
    perfectBatch: false,
    maxSessionCombo: 0,
    currentDailyStreak: 0,
    wordsMasteredCount: 0,
    wordsAttemptedCount: 0,
    levelWordsAttempted: {},
    levelWordTotals: {},
    ...overrides,
  };
}

describe("computeMaxSessionCombo", () => {
  it("counts the longest run of correct first-try attempts", () => {
    const attempts = [
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
      { correct: false, attemptNumber: 1 },
      { correct: true, attemptNumber: 2 }, // correct but not first-try — breaks the run
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
      { correct: true, attemptNumber: 1 },
    ];
    expect(computeMaxSessionCombo(attempts)).toBe(3);
  });

  it("returns 0 for an empty or all-wrong session", () => {
    expect(computeMaxSessionCombo([])).toBe(0);
    expect(computeMaxSessionCombo([{ correct: false, attemptNumber: 1 }])).toBe(0);
  });
});

describe("checkNewlyUnlockedAchievements", () => {
  it("unlocks first_session only on a user's first completed session", () => {
    const unlocked = checkNewlyUnlockedAchievements(baseFacts({ isFirstSession: true }), new Set());
    expect(unlocked).toContain("first_session");
  });

  it("never re-unlocks an achievement already in alreadyUnlocked", () => {
    const facts = baseFacts({ isFirstSession: true, perfectBatch: true });
    const unlocked = checkNewlyUnlockedAchievements(facts, new Set(["first_session", "first_perfect_batch"]));
    expect(unlocked).toEqual([]);
  });

  it("unlocks streak_7 at exactly 7 but not at 6", () => {
    expect(checkNewlyUnlockedAchievements(baseFacts({ currentDailyStreak: 6 }), new Set())).not.toContain("streak_7");
    expect(checkNewlyUnlockedAchievements(baseFacts({ currentDailyStreak: 7 }), new Set())).toContain("streak_7");
  });

  it("unlocks streak_30 without double-unlocking streak_7 that's already recorded", () => {
    const unlocked = checkNewlyUnlockedAchievements(
      baseFacts({ currentDailyStreak: 30 }),
      new Set(["streak_7"]),
    );
    expect(unlocked).toContain("streak_30");
    expect(unlocked).not.toContain("streak_7");
  });

  it("unlocks level_complete only once every word in that level has been attempted", () => {
    const facts = baseFacts({
      levelWordTotals: { A1: 530 },
      levelWordsAttempted: { A1: 529 },
    });
    expect(checkNewlyUnlockedAchievements(facts, new Set())).not.toContain("a1_complete");

    const complete = baseFacts({
      levelWordTotals: { A1: 530 },
      levelWordsAttempted: { A1: 530 },
    });
    expect(checkNewlyUnlockedAchievements(complete, new Set())).toContain("a1_complete");
  });

  it("every achievement id is unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
