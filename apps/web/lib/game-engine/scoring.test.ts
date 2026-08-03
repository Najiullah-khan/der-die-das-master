import { describe, expect, it } from "vitest";
import { calculateBatchScore, calculateMastery, pointsForAttempt, PERFECT_BATCH_BONUS } from "./scoring";

describe("pointsForAttempt", () => {
  it("awards 100 for a first-try correct guess", () => {
    expect(pointsForAttempt(1)).toBe(100);
  });
  it("awards 50 for a second-try correct guess", () => {
    expect(pointsForAttempt(2)).toBe(50);
  });
  it("awards 10 for a third-or-later-try correct guess", () => {
    expect(pointsForAttempt(3)).toBe(10);
    expect(pointsForAttempt(7)).toBe(10);
  });
});

describe("calculateBatchScore", () => {
  it("sums per-word points with no bonus when there were errors", () => {
    const result = calculateBatchScore([1, 2, 3], 2); // 100 + 50 + 10, 2 wrong guesses somewhere
    expect(result.baseScore).toBe(160);
    expect(result.perfectBatch).toBe(false);
    expect(result.bonus).toBe(0);
    expect(result.total).toBe(160);
  });

  it("applies the flawless-batch bonus when totalErrors is 0", () => {
    const result = calculateBatchScore([1, 1, 1], 0);
    expect(result.baseScore).toBe(300);
    expect(result.perfectBatch).toBe(true);
    expect(result.bonus).toBe(PERFECT_BATCH_BONUS);
    expect(result.total).toBe(300 + PERFECT_BATCH_BONUS);
  });

  it("does not award the bonus for an empty batch even with zero errors", () => {
    const result = calculateBatchScore([], 0);
    expect(result.perfectBatch).toBe(false);
    expect(result.total).toBe(0);
  });
});

describe("calculateMastery", () => {
  it("is Never Seen with zero attempts", () => {
    expect(calculateMastery(0, 0)).toBe("Never Seen");
  });
  it("is Struggled below 50% accuracy", () => {
    expect(calculateMastery(4, 1)).toBe("Struggled");
  });
  it("is Learning between 50% and 80% accuracy", () => {
    expect(calculateMastery(4, 2)).toBe("Learning");
  });
  it("is Mastered at 80%+ accuracy but not a clean streak", () => {
    expect(calculateMastery(5, 4)).toBe("Mastered");
  });
  it("is Perfect only with 100% accuracy across at least 3 attempts", () => {
    expect(calculateMastery(3, 3)).toBe("Perfect");
    expect(calculateMastery(2, 2)).toBe("Mastered"); // 100% but not enough reps yet
  });
});
