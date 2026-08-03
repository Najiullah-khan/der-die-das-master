export interface StreakState {
  currentDailyStreak: number;
  highestDailyStreak: number;
  currentSessionStreak: number;
  highestSessionStreak: number;
  /** YYYY-MM-DD, or null if the user has never played. */
  lastPlayedDate: string | null;
}

export function initialStreakState(): StreakState {
  return {
    currentDailyStreak: 0,
    highestDailyStreak: 0,
    currentSessionStreak: 0,
    highestSessionStreak: 0,
    lastPlayedDate: null,
  };
}

function parseDateUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days between two YYYY-MM-DD dates (UTC, so it's not affected by DST). */
function daysBetween(from: string, to: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((parseDateUTC(to) - parseDateUTC(from)) / MS_PER_DAY);
}

/**
 * Updates the daily streak for a play event happening on `today` (YYYY-MM-DD).
 * - First-ever play, or exactly one day after the last play: streak continues/starts.
 * - Same day as last play: no-op (already counted today).
 * - Any larger gap: streak resets to 1.
 */
export function updateDailyStreak(state: StreakState, today: string): StreakState {
  if (!state.lastPlayedDate) {
    return {
      ...state,
      currentDailyStreak: 1,
      highestDailyStreak: Math.max(1, state.highestDailyStreak),
      lastPlayedDate: today,
    };
  }

  const gap = daysBetween(state.lastPlayedDate, today);

  if (gap === 0) {
    return state;
  }

  if (gap === 1) {
    const currentDailyStreak = state.currentDailyStreak + 1;
    return {
      ...state,
      currentDailyStreak,
      highestDailyStreak: Math.max(currentDailyStreak, state.highestDailyStreak),
      lastPlayedDate: today,
    };
  }

  // gap > 1 (or negative, e.g. clock skew) — streak is broken, start over.
  return {
    ...state,
    currentDailyStreak: 1,
    highestDailyStreak: Math.max(1, state.highestDailyStreak),
    lastPlayedDate: today,
  };
}

/**
 * Session streak = consecutive correct-first-try guesses (a combo counter), per the
 * `Streaks.current_session_streak` column comment in the blueprint schema (§3). Any
 * guess that isn't correct-on-the-first-attempt breaks the combo back to 0.
 */
export function updateSessionStreak(state: StreakState, correctFirstTry: boolean): StreakState {
  if (!correctFirstTry) {
    return { ...state, currentSessionStreak: 0 };
  }
  const currentSessionStreak = state.currentSessionStreak + 1;
  return {
    ...state,
    currentSessionStreak,
    highestSessionStreak: Math.max(currentSessionStreak, state.highestSessionStreak),
  };
}
