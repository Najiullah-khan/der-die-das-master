import type { Mastery } from "@ddd/shared";

/** Flat bonus awarded when a whole batch is cleared with zero wrong guesses. */
export const PERFECT_BATCH_BONUS = 500;

/** Points for solving a word on a given attempt: 1st try = 100, 2nd = 50, 3rd+ = 10. */
export function pointsForAttempt(attemptNumber: number): number {
  if (attemptNumber <= 1) return 100;
  if (attemptNumber === 2) return 50;
  return 10;
}

export interface BatchScore {
  baseScore: number;
  perfectBatch: boolean;
  bonus: number;
  total: number;
}

/**
 * Sums per-word points from a completed batch and applies the flawless-batch bonus
 * (blueprint: "+500 points ... if total batch errors == 0").
 */
export function calculateBatchScore(
  completedAttempts: number[],
  totalErrors: number,
): BatchScore {
  const baseScore = completedAttempts.reduce((sum, attempts) => sum + pointsForAttempt(attempts), 0);
  const perfectBatch = totalErrors === 0 && completedAttempts.length > 0;
  const bonus = perfectBatch ? PERFECT_BATCH_BONUS : 0;
  return { baseScore, perfectBatch, bonus, total: baseScore + bonus };
}

/**
 * Simple, dependency-free mastery classification from lifetime attempts/correct counts
 * (blueprint §12: "no AI needed" for this). Never Seen has no attempts; Perfect requires
 * a track record (3+ reps) of never missing, not just a lucky single correct guess.
 */
export function calculateMastery(attempts: number, correct: number): Mastery {
  if (attempts === 0) return "Never Seen";
  const accuracy = correct / attempts;
  if (accuracy === 1 && attempts >= 3) return "Perfect";
  if (accuracy >= 0.8) return "Mastered";
  if (accuracy >= 0.5) return "Learning";
  return "Struggled";
}
