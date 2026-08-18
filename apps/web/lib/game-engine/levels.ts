import type { CefrLevel } from "@ddd/shared";

/** Words per batch (blueprint upgrade: batch progression & level unlocking). */
export const BATCH_SIZE = 10;

export const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Levels with seeded vocabulary — safe to unlock, play, and run placement challenges against. */
export const PLAYABLE_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2"];

/** Levels that exist in `LEVEL_ORDER` but have no seeded vocabulary yet (level-availability upgrade). */
export const COMING_SOON_LEVELS: CefrLevel[] = ["C1", "C2"];

export function isPlayableLevel(level: CefrLevel): boolean {
  return PLAYABLE_LEVELS.includes(level);
}

export function isComingSoonLevel(level: CefrLevel): boolean {
  return COMING_SOON_LEVELS.includes(level);
}

/** The level that must be passed to unlock `level`, or null for A1 (unlocked by default). */
export function getPrerequisiteLevel(level: CefrLevel): CefrLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  return index <= 0 ? null : LEVEL_ORDER[index - 1];
}

/**
 * The level `level` is the prerequisite for — null for C2 (nothing beyond it), and also null
 * when the next level in sequence isn't playable yet (level-availability upgrade: there's no
 * vocabulary to run a placement challenge against a Coming Soon level). Completing the last
 * *playable* level therefore surfaces a "mastered everything available" banner instead of a
 * placement-challenge CTA pointing at empty content — see `hasComingSoonLevelsAfter`.
 */
export function getNextLevel(level: CefrLevel): CefrLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  if (index === -1 || index === LEVEL_ORDER.length - 1) return null;
  const next = LEVEL_ORDER[index + 1];
  return isPlayableLevel(next) ? next : null;
}

/** True when `level` is the current playable ceiling but more (Coming Soon) levels exist beyond it. */
export function hasComingSoonLevelsAfter(level: CefrLevel): boolean {
  const index = LEVEL_ORDER.indexOf(level);
  if (index === -1) return false;
  return LEVEL_ORDER.slice(index + 1).some((l) => isComingSoonLevel(l));
}
