import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts, streaks } from "@/lib/db/schema";
import { calculateBatchScore } from "@/lib/game-engine/scoring";
import { initialStreakState, updateDailyStreak } from "@/lib/game-engine/streaks";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  // Score is derived server-side from the logged attempts, never trusted from the client.
  const attempts = await db.select().from(sessionAttempts).where(eq(sessionAttempts.sessionId, sessionId));

  const completedAttemptNumbers = attempts.filter((a) => a.correct).map((a) => a.attemptNumber);
  const totalErrors = attempts.filter((a) => !a.correct).length;
  const { total, perfectBatch } = calculateBatchScore(completedAttemptNumbers, totalErrors);

  const now = new Date();
  await db
    .update(gameSessions)
    .set({ score: total, perfectBatch, completedAt: now })
    .where(eq(gameSessions.id, sessionId));

  let streakResult: { current: number; highest: number } | null = null;
  if (session.userId) {
    const userId = session.userId;
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
  }

  return NextResponse.json({ score: total, perfectBatch, streak: streakResult });
}
