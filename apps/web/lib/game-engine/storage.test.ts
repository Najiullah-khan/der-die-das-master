// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearGuestProgress, loadGuestProgress, recordAttempt, recordSessionComplete } from "./storage";

beforeEach(() => {
  clearGuestProgress();
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
