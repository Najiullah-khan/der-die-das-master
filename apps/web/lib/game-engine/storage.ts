import type { CefrLevel, Mastery } from "@ddd/shared";
import { calculateMastery } from "./scoring";
import { initialStreakState, updateDailyStreak, type StreakState } from "./streaks";

const STORAGE_KEY = "ddd:guest-progress:v1";
const SEEN_SAVE_PROMPT_KEY = "ddd:seen-save-prompt:v1";

export interface GuestWordStat {
  attempts: number;
  correct: number;
  lastPracticedAt: number;
  mastery: Mastery;
}

export interface GuestBatchProgress {
  highestBatchReached: number;
  selectedBatch: number;
}

export interface GuestProgress {
  totalScore: number;
  /** Keyed by word id. */
  wordStats: Record<number, GuestWordStat>;
  streaks: StreakState;
  /** Keyed by CEFR level; absent = batch 1 only (defaultBatchProgress()). */
  levelProgress: Partial<Record<CefrLevel, GuestBatchProgress>>;
  /** A1 is always implicitly unlocked even if absent from this list. */
  unlockedLevels: CefrLevel[];
  /** Resume-state upgrade: the level most recently completed a batch in, null until the first one. */
  lastPlayedLevel: CefrLevel | null;
  /** Highest batch number *fully completed* per level (level badges upgrade — see server-side twin, getMaxCompletedBatchByLevel). */
  completedBatches: Partial<Record<CefrLevel, number>>;
}

function initialGuestProgress(): GuestProgress {
  return {
    totalScore: 0,
    wordStats: {},
    streaks: initialStreakState(),
    levelProgress: {},
    unlockedLevels: ["A1"],
    lastPlayedLevel: null,
    completedBatches: {},
  };
}

export function defaultBatchProgress(): GuestBatchProgress {
  return { highestBatchReached: 1, selectedBatch: 1 };
}

export function getGuestBatchProgress(progress: GuestProgress, level: CefrLevel): GuestBatchProgress {
  return progress.levelProgress[level] ?? defaultBatchProgress();
}

export function isGuestLevelUnlocked(progress: GuestProgress, level: CefrLevel): boolean {
  return level === "A1" || progress.unlockedLevels.includes(level);
}

/**
 * Records a completed batch — resume point + unlocks the next batch (mirrors advanceBatch on
 * the server, minus its max-batch cap query: a guest can only ever reach a batch that actually
 * had words, since starting a session for an out-of-range batch already fails gracefully before
 * this could be called for it).
 */
export function recordBatchComplete(level: CefrLevel, batch: number): GuestProgress {
  const progress = loadGuestProgress();
  const existing = getGuestBatchProgress(progress, level);
  const highestBatchReached = Math.max(existing.highestBatchReached, batch + 1);
  const updated: GuestProgress = {
    ...progress,
    levelProgress: {
      ...progress.levelProgress,
      [level]: {
        highestBatchReached,
        // The resume point is the *next* batch to play, not the one just finished
        // (auto-load-next-batch fix) — mirrors advanceBatch's server-side twin.
        selectedBatch: highestBatchReached,
      },
    },
    lastPlayedLevel: level,
    completedBatches: {
      ...progress.completedBatches,
      [level]: Math.max(progress.completedBatches[level] ?? 0, batch),
    },
  };
  saveGuestProgress(updated);
  return updated;
}

/** Unlocks `level` — called when a placement challenge for it is passed (guest path, mirrors unlockLevel). */
export function recordLevelUnlocked(level: CefrLevel): GuestProgress {
  const progress = loadGuestProgress();
  if (progress.unlockedLevels.includes(level)) return progress;
  const updated: GuestProgress = { ...progress, unlockedLevels: [...progress.unlockedLevels, level] };
  saveGuestProgress(updated);
  return updated;
}

/** Same >= 80% first-try-accuracy pass rule as the server (`/api/session/[id]/complete`). */
export function passedPlacementChallenge(firstTryCorrect: number, totalWords: number): boolean {
  return totalWords > 0 && firstTryCorrect / totalWords >= 0.8;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Guests get frictionless play (blueprint §5) — a storage failure should never crash the game. */
export function loadGuestProgress(): GuestProgress {
  if (!isBrowser()) return initialGuestProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialGuestProgress();
    const parsed = JSON.parse(raw) as GuestProgress;
    return {
      totalScore: parsed.totalScore ?? 0,
      wordStats: parsed.wordStats ?? {},
      streaks: parsed.streaks ?? initialStreakState(),
      levelProgress: parsed.levelProgress ?? {},
      unlockedLevels: parsed.unlockedLevels ?? ["A1"],
      lastPlayedLevel: parsed.lastPlayedLevel ?? null,
      completedBatches: parsed.completedBatches ?? {},
    };
  } catch {
    return initialGuestProgress();
  }
}

function saveGuestProgress(progress: GuestProgress): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage full/disabled — guest just loses persistence for this session, not a hard failure.
  }
}

/** Records one guess against a word, updating its lifetime attempts/correct/mastery. */
export function recordAttempt(wordId: number, correct: boolean, now: number = Date.now()): GuestProgress {
  const progress = loadGuestProgress();
  const existing = progress.wordStats[wordId] ?? { attempts: 0, correct: 0, lastPracticedAt: now, mastery: "Never Seen" as Mastery };

  const attempts = existing.attempts + 1;
  const correctCount = existing.correct + (correct ? 1 : 0);

  const updated: GuestProgress = {
    ...progress,
    wordStats: {
      ...progress.wordStats,
      [wordId]: {
        attempts,
        correct: correctCount,
        lastPracticedAt: now,
        mastery: calculateMastery(attempts, correctCount),
      },
    },
  };

  saveGuestProgress(updated);
  return updated;
}

/** Records a completed session's score and rolls the daily streak forward. */
export function recordSessionComplete(points: number, today: string): GuestProgress {
  const progress = loadGuestProgress();
  const updated: GuestProgress = {
    ...progress,
    totalScore: progress.totalScore + points,
    streaks: updateDailyStreak(progress.streaks, today),
  };
  saveGuestProgress(updated);
  return updated;
}

export function clearGuestProgress(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Whether the guest has already seen (and dismissed/converted from) the end-of-Batch-1
 * "save your progress" modal — kept in its own key, separate from guest progress data, so it
 * survives a `clearGuestProgress()` call (irrelevant once signed in, but harmless either way).
 */
export function hasSeenSaveProgressPrompt(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(SEEN_SAVE_PROMPT_KEY) === "1";
}

export function markSaveProgressPromptSeen(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SEEN_SAVE_PROMPT_KEY, "1");
  } catch {
    // localStorage full/disabled — worst case the modal reappears next session, not a hard failure.
  }
}
