// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearGuestProgress,
  loadGuestProgress,
  recordAttempt,
  recordBatchComplete,
  recordSessionComplete,
  hasSeenSaveProgressPrompt,
  markSaveProgressPromptSeen,
} from "./storage";

beforeEach(() => {
  clearGuestProgress();
  window.localStorage.clear();
});

describe("loadGuestProgress", () => {
  it("returns a fresh, empty progress object when nothing is stored", () => {
    const progress = loadGuestProgress();
    expect(progress.totalScore).toBe(0);
    expect(progress.wordStats).toEqual({});
    expect(progress.streaks.currentDailyStreak).toBe(0);
  });
});

describe("recordAttempt", () => {
  it("creates a stat entry on first attempt and persists it", () => {
    recordAttempt(42, true);
    const progress = loadGuestProgress();
    expect(progress.wordStats[42]).toMatchObject({ attempts: 1, correct: 1, mastery: "Mastered" });
  });

  it("accumulates attempts/correct across multiple calls", () => {
    recordAttempt(42, true);
    recordAttempt(42, false);
    recordAttempt(42, true);
    const progress = loadGuestProgress();
    expect(progress.wordStats[42]).toMatchObject({ attempts: 3, correct: 2 });
  });
});

describe("recordSessionComplete", () => {
  it("adds points to the running total and advances the daily streak", () => {
    recordSessionComplete(150, "2026-08-01");
    let progress = loadGuestProgress();
    expect(progress.totalScore).toBe(150);
    expect(progress.streaks.currentDailyStreak).toBe(1);

    recordSessionComplete(100, "2026-08-02");
    progress = loadGuestProgress();
    expect(progress.totalScore).toBe(250);
    expect(progress.streaks.currentDailyStreak).toBe(2);
  });
});

describe("recordBatchComplete", () => {
  it("tracks the resume level and the highest fully-completed batch (resume-state upgrade)", () => {
    expect(loadGuestProgress().lastPlayedLevel).toBeNull();

    recordBatchComplete("A1", 1);
    let progress = loadGuestProgress();
    expect(progress.lastPlayedLevel).toBe("A1");
    expect(progress.completedBatches.A1).toBe(1);
    // selectedBatch is the *next* batch to play, not the one just finished (batch auto-advance
    // fix) — a returning user should land on Batch 2, not restart Batch 1.
    expect(progress.levelProgress.A1).toMatchObject({ highestBatchReached: 2, selectedBatch: 2 });

    recordBatchComplete("A2", 3);
    progress = loadGuestProgress();
    expect(progress.lastPlayedLevel).toBe("A2");
    expect(progress.completedBatches).toEqual({ A1: 1, A2: 3 });

    // Replaying an earlier batch doesn't regress the level's highest completed batch.
    recordBatchComplete("A2", 1);
    progress = loadGuestProgress();
    expect(progress.completedBatches.A2).toBe(3);
  });
});

describe("save-progress prompt", () => {
  it("is unseen until explicitly marked", () => {
    expect(hasSeenSaveProgressPrompt()).toBe(false);
    markSaveProgressPromptSeen();
    expect(hasSeenSaveProgressPrompt()).toBe(true);
  });
});
