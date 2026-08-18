import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import type { CefrLevel } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts, userWordStats, words } from "@/lib/db/schema";

/** Facts needed by `checkNewlyUnlockedAchievements` (blueprint §11 achievement checks), gathered in one place. */

export async function countCompletedSessions(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(gameSessions)
    .where(and(eq(gameSessions.userId, userId), isNotNull(gameSessions.completedAt)));
  return row?.n ?? 0;
}

export async function countWordsMastered(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(userWordStats)
    .where(and(eq(userWordStats.userId, userId), inArray(userWordStats.mastery, ["Mastered", "Perfect"])));
  return row?.n ?? 0;
}

export async function countWordsAttempted(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(userWordStats)
    .where(and(eq(userWordStats.userId, userId), gt(userWordStats.attempts, 0)));
  return row?.n ?? 0;
}

export async function countWordsAttemptedForLevel(userId: string, level: CefrLevel): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(userWordStats)
    .innerJoin(words, eq(words.id, userWordStats.wordId))
    .where(and(eq(userWordStats.userId, userId), eq(words.cefrLevel, level), gt(userWordStats.attempts, 0)));
  return row?.n ?? 0;
}

export async function countWordsForLevel(level: CefrLevel): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(words).where(eq(words.cefrLevel, level));
  return row?.n ?? 0;
}

/** Word count per CEFR level in one grouped query (level badges upgrade: total-batch counts for all 6 levels at once). */
export async function countWordsByLevel(): Promise<Record<CefrLevel, number>> {
  const rows = await db
    .select({ cefrLevel: words.cefrLevel, n: sql<number>`count(*)` })
    .from(words)
    .groupBy(words.cefrLevel);
  const byLevel = Object.fromEntries(rows.map((r) => [r.cefrLevel, r.n])) as Record<CefrLevel, number>;
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"] as const) {
    byLevel[level] ??= 0;
  }
  return byLevel;
}

/**
 * Highest batch number a user has *fully completed* per level, derived from real session rows
 * (level badges upgrade: `userProgress.highestBatchReached` alone can't distinguish "about to
 * play the last batch" from "already finished it" without touching the gating logic itself).
 */
export async function getMaxCompletedBatchByLevel(userId: string): Promise<Partial<Record<CefrLevel, number>>> {
  const rows = await db
    .select({ cefrLevel: gameSessions.cefrLevel, maxBatch: sql<number>`max(${gameSessions.batch})` })
    .from(gameSessions)
    .where(and(eq(gameSessions.userId, userId), isNotNull(gameSessions.completedAt)))
    .groupBy(gameSessions.cefrLevel);
  return Object.fromEntries(rows.map((r) => [r.cefrLevel, r.maxBatch]));
}

/** Overall correct/attempts ratio across every word the user has ever tried, 0-100. Null with zero attempts (avoids a 0% that reads as "you're bad," not "you haven't played yet"). */
export async function getUserAccuracy(userId: string): Promise<number | null> {
  const [row] = await db
    .select({
      attempts: sql<number>`coalesce(sum(${userWordStats.attempts}), 0)`,
      correct: sql<number>`coalesce(sum(${userWordStats.correct}), 0)`,
    })
    .from(userWordStats)
    .where(eq(userWordStats.userId, userId));
  if (!row || row.attempts === 0) return null;
  return Math.round((row.correct / row.attempts) * 100);
}

export async function getUserTotalScore(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${gameSessions.score}), 0)` })
    .from(gameSessions)
    .where(and(eq(gameSessions.userId, userId), isNotNull(gameSessions.completedAt)));
  return row?.total ?? 0;
}

/** Ordered so a caller can find the longest run of correct, first-try attempts (blueprint's "session streak"). */
export async function getSessionAttemptsInOrder(sessionId: string) {
  return db
    .select({ correct: sessionAttempts.correct, attemptNumber: sessionAttempts.attemptNumber })
    .from(sessionAttempts)
    .where(eq(sessionAttempts.sessionId, sessionId))
    .orderBy(sessionAttempts.id);
}
