import { describe, expect, it } from "vitest";
import { initialStreakState, updateDailyStreak, updateSessionStreak } from "./streaks";

describe("updateDailyStreak", () => {
  it("starts a streak of 1 on the very first play", () => {
    const state = updateDailyStreak(initialStreakState(), "2026-08-01");
    expect(state.currentDailyStreak).toBe(1);
    expect(state.highestDailyStreak).toBe(1);
    expect(state.lastPlayedDate).toBe("2026-08-01");
  });

  it("is a no-op when playing again the same day", () => {
    let state = updateDailyStreak(initialStreakState(), "2026-08-01");
    state = updateDailyStreak(state, "2026-08-01");
    expect(state.currentDailyStreak).toBe(1);
  });

  it("increments the streak on exactly the next consecutive day", () => {
    let state = updateDailyStreak(initialStreakState(), "2026-08-01");
    state = updateDailyStreak(state, "2026-08-02");
    state = updateDailyStreak(state, "2026-08-03");
    expect(state.currentDailyStreak).toBe(3);
    expect(state.highestDailyStreak).toBe(3);
  });

  it("resets to 1 after a gap of more than one day", () => {
    let state = updateDailyStreak(initialStreakState(), "2026-08-01");
    state = updateDailyStreak(state, "2026-08-02");
    state = updateDailyStreak(state, "2026-08-10"); // big gap
    expect(state.currentDailyStreak).toBe(1);
    expect(state.highestDailyStreak).toBe(2); // high-water mark is preserved
  });

  it("carries the streak correctly across a month boundary", () => {
    let state = updateDailyStreak(initialStreakState(), "2026-07-31");
    state = updateDailyStreak(state, "2026-08-01");
    expect(state.currentDailyStreak).toBe(2);
  });
});

describe("updateSessionStreak", () => {
  it("increments on each consecutive correct-first-try guess", () => {
    let state = updateSessionStreak(initialStreakState(), true);
    state = updateSessionStreak(state, true);
    state = updateSessionStreak(state, true);
    expect(state.currentSessionStreak).toBe(3);
    expect(state.highestSessionStreak).toBe(3);
  });

  it("resets to 0 on any non-first-try guess", () => {
    let state = updateSessionStreak(initialStreakState(), true);
    state = updateSessionStreak(state, true);
    state = updateSessionStreak(state, false);
    expect(state.currentSessionStreak).toBe(0);
    expect(state.highestSessionStreak).toBe(2); // high-water mark survives the reset
  });
});
