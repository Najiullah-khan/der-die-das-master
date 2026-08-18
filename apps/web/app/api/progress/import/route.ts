import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { streaks, userProgress, userWordStats } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateMastery } from "@/lib/game-engine/scoring";
import { getLevelProgress, unlockLevel } from "@/lib/db/queries/user-progress";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const MASTERY_VALUES = ["Never Seen", "Struggled", "Learning", "Mastered", "Perfect"] as const;
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const bodySchema = z.object({
  totalScore: z.number().int().min(0).default(0),
  wordStats: z.record(
    z.coerce.number().int().positive(),
    z.object({
      attempts: z.number().int().min(0),
      correct: z.number().int().min(0),
      lastPracticedAt: z.number().int().min(0),
      mastery: z.enum(MASTERY_VALUES),
    }),
  ),
  streaks: z.object({
    currentDailyStreak: z.number().int().min(0),
    highestDailyStreak: z.number().int().min(0),
    currentSessionStreak: z.number().int().min(0),
    highestSessionStreak: z.number().int().min(0),
    lastPlayedDate: z.string().nullable(),
  }),
  unlockedLevels: z.array(z.enum(CEFR_LEVELS)).default([]),
  lastPlayedLevel: z.enum(CEFR_LEVELS).nullable().default(null),
  // Keyed by CEFR level, but a plain string-keyed record — z.record() with an enum key schema
  // infers a *complete* Record (all 6 keys required), which a partial guest object never is.
  // Unknown/malformed keys are just skipped when this is consumed below.
  levelProgress: z
    .record(
      z.string(),
      z.object({
        highestBatchReached: z.number().int().min(1),
        selectedBatch: z.number().int().min(1),
      }),
    )
    .default({}),
});

/**
 * Merges a guest's localStorage progress (blueprint §5 step 4) into the now-authenticated
 * user's account. Operates on the *aggregated* per-word counters that `storage.ts` already
 * tracks client-side (attempts/correct), summed onto any existing server-side counters —
 * simpler than reconciling individual attempt timestamps, and sufficient since this merge
 * happens once per guest-to-account transition (the client clears localStorage right after).
 *
 * The streak is only adopted if the user has no server-side streak yet — an established
 * streak is never overwritten by client-reported guest data.
 *
 * unlockedLevels/levelProgress (batch progression upgrade) are merged the same permissive way
 * as word stats — union of unlocks, max of highestBatchReached — so a guest who unlocked a
 * level before signing in never sees it re-locked afterward.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit("progress:import", user.id, 10);
  if (!allowed) return rateLimitResponse();

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const { wordStats, streaks: guestStreak, unlockedLevels, levelProgress, lastPlayedLevel } = parsed.data;

  let wordsImported = 0;
  for (const [wordIdStr, guestStat] of Object.entries(wordStats)) {
    const wordId = Number(wordIdStr);

    const [existing] = await db
      .select()
      .from(userWordStats)
      .where(and(eq(userWordStats.userId, user.id), eq(userWordStats.wordId, wordId)))
      .limit(1);

    const attempts = (existing?.attempts ?? 0) + guestStat.attempts;
    const correct = (existing?.correct ?? 0) + guestStat.correct;
    const mastery = calculateMastery(attempts, correct);
    const guestLastPracticed = new Date(guestStat.lastPracticedAt);
    const lastPracticedAt =
      existing?.lastPracticedAt && existing.lastPracticedAt > guestLastPracticed
        ? existing.lastPracticedAt
        : guestLastPracticed;

    await db
      .insert(userWordStats)
      .values({
        userId: user.id,
        wordId,
        attempts,
        correct,
        firstSeenAt: existing?.firstSeenAt ?? guestLastPracticed,
        lastPracticedAt,
        mastery,
      })
      .onConflictDoUpdate({
        target: [userWordStats.userId, userWordStats.wordId],
        set: { attempts, correct, lastPracticedAt, mastery },
      });

    wordsImported++;
  }

  let streakImported = false;
  if (guestStreak.lastPlayedDate) {
    const [existingStreak] = await db.select().from(streaks).where(eq(streaks.userId, user.id)).limit(1);
    if (!existingStreak) {
      await db.insert(streaks).values({ userId: user.id, ...guestStreak });
      streakImported = true;
    }
  }

  for (const level of unlockedLevels) {
    if (level !== "A1") await unlockLevel(user.id, level);
  }

  for (const [level, guestBatch] of Object.entries(levelProgress)) {
    if (!(CEFR_LEVELS as readonly string[]).includes(level)) continue;
    const cefrLevel = level as (typeof CEFR_LEVELS)[number];
    const existing = await getLevelProgress(user.id, cefrLevel);
    const highestBatchReached = Math.max(existing.highestBatchReached, guestBatch.highestBatchReached);
    const selectedBatch = Math.min(Math.max(guestBatch.selectedBatch, 1), highestBatchReached);
    // Only the guest's last-active level gets a fresh lastPlayedAt stamp (resume-state upgrade)
    // — the others keep whatever server-side value they already had, if any.
    const lastPlayedAt = cefrLevel === lastPlayedLevel ? new Date() : existing.lastPlayedAt;

    await db
      .insert(userProgress)
      .values({ userId: user.id, cefrLevel, highestBatchReached, selectedBatch, unlocked: true, lastPlayedAt })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.cefrLevel],
        set: { highestBatchReached, selectedBatch, lastPlayedAt },
      });
  }

  return NextResponse.json({ wordsImported, streakImported });
}
