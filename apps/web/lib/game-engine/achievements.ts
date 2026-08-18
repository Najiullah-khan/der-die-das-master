import type { CefrLevel } from "@ddd/shared";

export type AchievementCriteria =
  | { type: "first_session" }
  | { type: "perfect_batch" }
  | { type: "daily_streak"; threshold: number }
  | { type: "session_combo"; threshold: number }
  | { type: "words_mastered"; threshold: number }
  | { type: "words_attempted"; threshold: number }
  | { type: "level_complete"; level: CefrLevel };

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
}

// A curated set, not the full V2 roster (blueprint §11: "resist the urge to ship 100
// achievements at once — a curated set feels more prestigious"; §17 MVP: "Basic achievements (5–8)").
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_session",
    title: "First Steps",
    description: "Complete your first practice session.",
    icon: "👣",
    criteria: { type: "first_session" },
  },
  {
    id: "first_perfect_batch",
    title: "Flawless Batch",
    description: "Clear a whole session with zero wrong guesses.",
    icon: "🏆",
    criteria: { type: "perfect_batch" },
  },
  {
    id: "combo_10",
    title: "On a Roll",
    description: "Get 10 correct answers in a row, first try.",
    icon: "⚡",
    criteria: { type: "session_combo", threshold: 10 },
  },
  {
    id: "streak_7",
    title: "7-Day Streak",
    description: "Practice on 7 consecutive days.",
    icon: "🔥",
    criteria: { type: "daily_streak", threshold: 7 },
  },
  {
    id: "streak_30",
    title: "30-Day Streak",
    description: "Practice on 30 consecutive days.",
    icon: "🔥",
    criteria: { type: "daily_streak", threshold: 30 },
  },
  {
    id: "words_100_mastered",
    title: "100 Words Mastered",
    description: "Reach Mastered or Perfect on 100 words.",
    icon: "📚",
    criteria: { type: "words_mastered", threshold: 100 },
  },
  {
    id: "words_500_attempted",
    title: "Word Explorer",
    description: "Practice at least 500 different words.",
    icon: "🧭",
    criteria: { type: "words_attempted", threshold: 500 },
  },
  {
    id: "a1_complete",
    title: "Every A1 Word Learned",
    description: "Practice every word in the A1 deck at least once.",
    icon: "🎓",
    criteria: { type: "level_complete", level: "A1" },
  },
];

/** Facts gathered per completed session — enough to evaluate every criteria type above. */
export interface AchievementFacts {
  isFirstSession: boolean;
  perfectBatch: boolean;
  maxSessionCombo: number;
  currentDailyStreak: number;
  wordsMasteredCount: number;
  wordsAttemptedCount: number;
  /** Attempted-word count per level, only for levels with a `level_complete` achievement. */
  levelWordsAttempted: Partial<Record<CefrLevel, number>>;
  /** Total word count per level, same keys as `levelWordsAttempted`. */
  levelWordTotals: Partial<Record<CefrLevel, number>>;
}

function isCriteriaMet(criteria: AchievementCriteria, facts: AchievementFacts): boolean {
  switch (criteria.type) {
    case "first_session":
      return facts.isFirstSession;
    case "perfect_batch":
      return facts.perfectBatch;
    case "daily_streak":
      return facts.currentDailyStreak >= criteria.threshold;
    case "session_combo":
      return facts.maxSessionCombo >= criteria.threshold;
    case "words_mastered":
      return facts.wordsMasteredCount >= criteria.threshold;
    case "words_attempted":
      return facts.wordsAttemptedCount >= criteria.threshold;
    case "level_complete": {
      const total = facts.levelWordTotals[criteria.level];
      const attempted = facts.levelWordsAttempted[criteria.level];
      return total !== undefined && total > 0 && attempted !== undefined && attempted >= total;
    }
  }
}

/** Returns the ids of achievements `facts` satisfies that aren't already in `alreadyUnlocked`. */
export function checkNewlyUnlockedAchievements(facts: AchievementFacts, alreadyUnlocked: Set<string>): string[] {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlocked.has(a.id) && isCriteriaMet(a.criteria, facts)).map((a) => a.id);
}

/** Longest run of correct, first-try attempts in a session, in attempt order (blueprint's "session streak"). */
export function computeMaxSessionCombo(attempts: Array<{ correct: boolean; attemptNumber: number }>): number {
  let max = 0;
  let current = 0;
  for (const attempt of attempts) {
    if (attempt.correct && attempt.attemptNumber === 1) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}
