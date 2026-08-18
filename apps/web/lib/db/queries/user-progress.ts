import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { CefrLevel } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { userProgress } from "@/lib/db/schema";
import { BATCH_SIZE, LEVEL_ORDER } from "@/lib/game-engine/levels";
import { countWordsForLevel } from "@/lib/db/queries/gamification-stats";

export interface LevelProgress {
  cefrLevel: CefrLevel;
  highestBatchReached: number;
  selectedBatch: number;
  unlocked: boolean;
  lastPlayedAt: Date | null;
}

function defaultProgress(level: CefrLevel): LevelProgress {
  return {
    cefrLevel: level,
    highestBatchReached: 1,
    selectedBatch: 1,
    unlocked: level === "A1",
    lastPlayedAt: null,
  };
}

export async function getLevelProgress(userId: string, level: CefrLevel): Promise<LevelProgress> {
  const [row] = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.cefrLevel, level)))
    .limit(1);
  if (!row) return defaultProgress(level);
  return {
    cefrLevel: level,
    highestBatchReached: row.highestBatchReached,
    selectedBatch: row.selectedBatch,
    unlocked: row.unlocked || level === "A1",
    lastPlayedAt: row.lastPlayedAt,
  };
}

/** One row per level (A1 always included, always unlocked, even with no DB row). */
export async function getAllLevelProgress(userId: string): Promise<LevelProgress[]> {
  const rows = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  const byLevel = new Map(rows.map((r) => [r.cefrLevel, r]));

  return LEVEL_ORDER.map((level) => {
    const row = byLevel.get(level);
    if (!row) return defaultProgress(level);
    return {
      cefrLevel: level,
      highestBatchReached: row.highestBatchReached,
      selectedBatch: row.selectedBatch,
      unlocked: row.unlocked || level === "A1",
      lastPlayedAt: row.lastPlayedAt,
    };
  });
}

/** Total batch count for a level, derived from its word count (batch progression & level unlocking upgrade). */
export async function maxBatchForLevel(level: CefrLevel): Promise<number> {
  const total = await countWordsForLevel(level);
  return Math.max(1, Math.ceil(total / BATCH_SIZE));
}

/**
 * The level a user most recently completed a batch in — null for a brand new user with no
 * completed batches at all (resume-state upgrade: drives the "Resume" CTA on /play).
 */
export async function getLastPlayedLevel(userId: string): Promise<CefrLevel | null> {
  const [row] = await db
    .select({ cefrLevel: userProgress.cefrLevel })
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), isNotNull(userProgress.lastPlayedAt)))
    .orderBy(desc(userProgress.lastPlayedAt))
    .limit(1);
  return row?.cefrLevel ?? null;
}

/** Called after completing any batch — records it as the resume point and unlocks the next batch. */
export async function advanceBatch(
  userId: string,
  level: CefrLevel,
  batch: number,
  now: Date = new Date(),
): Promise<void> {
  const cap = await maxBatchForLevel(level);
  const existing = await getLevelProgress(userId, level);
  const highestBatchReached = Math.min(cap, Math.max(existing.highestBatchReached, batch + 1));
  // The resume point is the *next* batch to play, not the one just finished (auto-load-next-batch
  // fix) — a returning user landing on /play/[level] should pick up where they left off going
  // forward, not restart the batch they already cleared. Always kept equal to highestBatchReached
  // here; it only ever diverges via an explicit `?batch=` override at the route layer, which is
  // never persisted back to this column (replaying an old batch is a one-off view, not a progress change).
  const selectedBatch = highestBatchReached;

  await db
    .insert(userProgress)
    .values({ userId, cefrLevel: level, highestBatchReached, selectedBatch, unlocked: true, lastPlayedAt: now })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.cefrLevel],
      set: { highestBatchReached, selectedBatch, unlocked: true, lastPlayedAt: now },
    });
}

/** Unlocks `level` for `userId` — called when a placement challenge for it is passed. */
export async function unlockLevel(userId: string, level: CefrLevel, now: Date = new Date()): Promise<void> {
  await db
    .insert(userProgress)
    .values({ userId, cefrLevel: level, highestBatchReached: 1, selectedBatch: 1, unlocked: true, unlockedAt: now })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.cefrLevel],
      set: { unlocked: true, unlockedAt: now },
    });
}
