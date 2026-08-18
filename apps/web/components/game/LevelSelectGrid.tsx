"use client";

import { useState } from "react";
import type { CefrLevel } from "@ddd/shared";
import { LEVEL_ORDER, BATCH_SIZE, isComingSoonLevel } from "@/lib/game-engine/levels";
import { loadGuestProgress, getGuestBatchProgress, isGuestLevelUnlocked, type GuestProgress } from "@/lib/game-engine/storage";
import { LevelBadge, type LevelBadgeStatus } from "@/components/game/LevelBadge";
import type { LevelProgress } from "@/lib/db/queries/user-progress";

interface LevelSelectGridProps {
  /** null for guests — read from localStorage instead, same convention as PlayClient. */
  initialLevelProgress: LevelProgress[] | null;
  initialLastPlayedLevel: CefrLevel | null;
  completedBatchesByLevel: Partial<Record<CefrLevel, number>>;
  totalWordsByLevel: Record<CefrLevel, number>;
}

export function LevelSelectGrid({
  initialLevelProgress,
  initialLastPlayedLevel,
  completedBatchesByLevel,
  totalWordsByLevel,
}: LevelSelectGridProps) {
  const [guestProgress] = useState<GuestProgress | null>(() => (initialLevelProgress ? null : loadGuestProgress()));

  const progressByLevel = new Map(initialLevelProgress?.map((p) => [p.cefrLevel, p]) ?? []);
  const lastPlayedLevel = initialLevelProgress ? initialLastPlayedLevel : guestProgress?.lastPlayedLevel ?? null;
  const completedByLevel = initialLevelProgress ? completedBatchesByLevel : (guestProgress?.completedBatches ?? {});

  const levels = LEVEL_ORDER.map((level) => {
    const totalBatches = Math.max(1, Math.ceil((totalWordsByLevel[level] ?? 0) / BATCH_SIZE));
    const unlocked = initialLevelProgress
      ? (progressByLevel.get(level)?.unlocked ?? level === "A1")
      : isGuestLevelUnlocked(guestProgress!, level);
    const batchProgress = initialLevelProgress ? progressByLevel.get(level) : getGuestBatchProgress(guestProgress!, level);
    // Self-healing resume point (same fix as PlayClient's currentBatch initializer): take the
    // max of selectedBatch/highestBatchReached rather than trusting selectedBatch alone, so a
    // row written before the "selectedBatch = next batch" fix still resumes forward, not on an
    // already-cleared batch. Also clamped against totalBatches — guest storage doesn't know the
    // real word-count cap, so its values can land one past a level's actual last batch.
    const selectedBatch = Math.min(
      Math.max(batchProgress?.selectedBatch ?? 1, batchProgress?.highestBatchReached ?? 1, 1),
      totalBatches,
    );
    const maxCompletedBatch = completedByLevel[level] ?? 0;
    const percent = Math.min(100, Math.round((maxCompletedBatch / totalBatches) * 100));

    let status: LevelBadgeStatus = "locked";
    if (isComingSoonLevel(level)) {
      status = "coming-soon";
    } else if (unlocked) {
      status = maxCompletedBatch >= totalBatches ? "completed" : "unlocked";
    }

    return { level, status, percent, selectedBatch };
  });

  const resumeLevel = lastPlayedLevel ? levels.find((l) => l.level === lastPlayedLevel) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Choose a level</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Pass a placement challenge with 80% first-try accuracy to unlock the next level.
      </p>

      {resumeLevel && (
        <a
          href={`/play/${resumeLevel.level}?batch=${resumeLevel.selectedBatch}`}
          className="mt-6 flex items-center justify-between rounded-2xl bg-linear-to-r from-der to-das px-5 py-4 text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <span className="font-semibold">
            Resume {resumeLevel.level} · Batch {resumeLevel.selectedBatch}
          </span>
          <span aria-hidden>→</span>
        </a>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {levels.map(({ level, status, percent }) => (
          <LevelBadge
            key={level}
            level={level}
            status={status}
            percent={percent}
            href={`/play/${level}`}
            highlighted={level === lastPlayedLevel}
          />
        ))}
      </div>
    </main>
  );
}
