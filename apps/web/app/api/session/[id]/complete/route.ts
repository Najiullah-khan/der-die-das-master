import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import type { CefrLevel } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts, streaks } from "@/lib/db/schema";
import { calculateBatchScore } from "@/lib/game-engine/scoring";
import { initialStreakState, updateDailyStreak } from "@/lib/game-engine/streaks";
import { ACHIEVEMENTS, checkNewlyUnlockedAchievements, computeMaxSessionCombo, type AchievementFacts } from "@/lib/game-engine/achievements";
import { getUnlockedAchievementIds, unlockAchievements } from "@/lib/db/queries/achievements";
import {
  countCompletedSessions,
  countWordsAttempted,
  countWordsAttemptedForLevel,
  countWordsForLevel,
  countWordsMastered,
} from "@/lib/db/queries/gamification-stats";
import { advanceBatch, unlockLevel } from "@/lib/db/queries/user-progress";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";

// >= 80% correct-on-first-attempt to pass a placement challenge (confirmed design decision:
// the "No Word Left Behind" deck means every word is eventually answered correctly regardless
// of skill, so completion alone can't gate anything — first-try accuracy is the only real signal).
const PLACEMENT_PASS_THRESHOLD = 0.8;

const LEVEL_COMPLETE_LEVELS = [
  ...new Set(
    ACHIEVEMENTS.filter((a) => a.criteria.type === "level_complete").map(
      (a) => (a.criteria as { type: "level_complete"; level: CefrLevel }).level,
    ),
  ),
];

// Anti-farming floor (blueprint §16 risk note: "basic anomaly checks (implausible session
// completion times) before awarding leaderboard-eligible scores"). Deliberately generous —
// this only needs to catch sub-human, scripted round-trip speed, not just a fast player.
const MIN_MS_PER_ATTEMPT = 150;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  const { allowed } = await checkRateLimit("session:complete", getClientIp(request.headers), 30);
  if (!allowed) return rateLimitResponse();

  const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  // Score is derived server-side from the logged attempts, never trusted from the client.
  const attempts = await db.select().from(sessionAttempts).where(eq(sessionAttempts.sessionId, sessionId));

  const elapsedMs = Date.now() - session.startedAt.getTime();
  if (attempts.length > 0 && elapsedMs < attempts.length * MIN_MS_PER_ATTEMPT) {
    return NextResponse.json({ error: "Session completed implausibly fast" }, { status: 400 });
  }

  const completedAttemptNumbers = attempts.filter((a) => a.correct).map((a) => a.attemptNumber);
  const totalErrors = attempts.filter((a) => !a.correct).length;
  const { total, perfectBatch } = calculateBatchScore(completedAttemptNumbers, totalErrors);

  const now = new Date();
  await db
    .update(gameSessions)
    .set({ score: total, perfectBatch, completedAt: now })
    .where(eq(gameSessions.id, sessionId));

  const firstTryCorrectCount = attempts.filter((a) => a.correct && a.attemptNumber === 1).length;
  const firstTryAccuracy = attempts.length > 0 ? firstTryCorrectCount / attempts.length : 0;
  const placementTargetLevel = session.placementForLevel as CefrLevel | null;
  // Computed for every session regardless of auth — guest sessions still go through this
  // "online" route (only *offline* play skips the server entirely), and the pass/fail signal
  // itself doesn't depend on having a userId, only the persistence step (unlockLevel) below does.
  const placementResult = placementTargetLevel
    ? { level: placementTargetLevel, passed: firstTryAccuracy >= PLACEMENT_PASS_THRESHOLD }
    : null;

  let streakResult: { current: number; highest: number } | null = null;
  if (session.userId) {
    const userId = session.userId;

    // Batch progression: completing any batch records it as the resume point and unlocks the
    // next one. Runs regardless of placement status — starting the session already required
    // this level to be unlocked.
    await advanceBatch(userId, session.cefrLevel, session.batch);

    if (placementResult?.passed) {
      await unlockLevel(userId, placementResult.level, now);
    }

    const [existing] = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);

    const prevState = existing
      ? {
          currentDailyStreak: existing.currentDailyStreak,
          highestDailyStreak: existing.highestDailyStreak,
          currentSessionStreak: existing.currentSessionStreak,
          highestSessionStreak: existing.highestSessionStreak,
          lastPlayedDate: existing.lastPlayedDate,
        }
      : initialStreakState();

    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD, UTC
    const nextState = updateDailyStreak(prevState, today);

    await db
      .insert(streaks)
      .values({ userId, ...nextState })
      .onConflictDoUpdate({
        target: streaks.userId,
        set: {
          currentDailyStreak: nextState.currentDailyStreak,
          highestDailyStreak: nextState.highestDailyStreak,
          lastPlayedDate: nextState.lastPlayedDate,
        },
      });

    streakResult = { current: nextState.currentDailyStreak, highest: nextState.highestDailyStreak };

    // Achievement checks (blueprint §11) run once per completed session, authed users only.
    const [sessionsCompleted, wordsMasteredCount, wordsAttemptedCount, alreadyUnlocked] = await Promise.all([
      countCompletedSessions(userId),
      countWordsMastered(userId),
      countWordsAttempted(userId),
      getUnlockedAchievementIds(userId),
    ]);

    const levelWordsAttempted: AchievementFacts["levelWordsAttempted"] = {};
    const levelWordTotals: AchievementFacts["levelWordTotals"] = {};
    for (const level of LEVEL_COMPLETE_LEVELS) {
      const [attemptedForLevel, totalForLevel] = await Promise.all([
        countWordsAttemptedForLevel(userId, level),
        countWordsForLevel(level),
      ]);
      levelWordsAttempted[level] = attemptedForLevel;
      levelWordTotals[level] = totalForLevel;
    }

    const facts: AchievementFacts = {
      isFirstSession: sessionsCompleted === 1,
      perfectBatch,
      maxSessionCombo: computeMaxSessionCombo([...attempts].sort((a, b) => a.id - b.id)),
      currentDailyStreak: nextState.currentDailyStreak,
      wordsMasteredCount,
      wordsAttemptedCount,
      levelWordsAttempted,
      levelWordTotals,
    };

    const newlyUnlocked = checkNewlyUnlockedAchievements(facts, alreadyUnlocked);
    await unlockAchievements(userId, newlyUnlocked, now);
  }

  return NextResponse.json({
    score: total,
    perfectBatch,
    streak: streakResult,
    batch: session.batch,
    firstTryAccuracy,
    placementResult,
  });
}
