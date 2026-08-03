import type { Mastery } from "@ddd/shared";
import { calculateMastery } from "./scoring";
import { initialStreakState, updateDailyStreak, type StreakState } from "./streaks";

const STORAGE_KEY = "ddd:guest-progress:v1";

export interface GuestWordStat {
  attempts: number;
  correct: number;
  lastPracticedAt: number;
  mastery: Mastery;
}

export interface GuestProgress {
  totalScore: number;
  /** Keyed by word id. */
  wordStats: Record<number, GuestWordStat>;
  streaks: StreakState;
}

function initialGuestProgress(): GuestProgress {
  return { totalScore: 0, wordStats: {}, streaks: initialStreakState() };
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
