import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gameSessions, leaderboard, streaks, user, userWordStats } from "@/lib/db/schema";

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  score: number;
  wordsMastered: number | null;
  currentDailyStreak: number;
  rank: number;
}

export interface LeaderboardView {
  /** Top `limit` rows (default 50). */
  entries: LeaderboardRow[];
  /** The requesting user's own row, even when outside `entries` — null for guests, or an authed user with no score this period. */
  viewer: LeaderboardRow | null;
}

const DEFAULT_LIMIT = 50;

/** Monday 00:00 UTC of the week containing `now` — a calendar week, not a rolling 7-day lookback. */
function startOfCurrentWeekUTC(now: Date = new Date()): Date {
  const day = now.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday, 0, 0, 0, 0));
}

/**
 * Live-aggregated and fully ranked (no SQL-level LIMIT) — bounded to the current calendar week,
 * so summing on every read stays cheap regardless of account age (the materialization concern in
 * blueprint §3 is specifically about summing *all-time* history on every page view). Returning
 * every ranked row, not just the top page, is what lets `getLeaderboardView` find an
 * outside-the-top-50 viewer's rank without a second query.
 */
async function computeWeeklyRanked(): Promise<LeaderboardRow[]> {
  const since = startOfCurrentWeekUTC();
  const rows = await db
    .select({
      userId: gameSessions.userId,
      displayName: user.name,
      score: sql<number>`sum(${gameSessions.score})`,
      currentDailyStreak: sql<number>`coalesce(max(${streaks.currentDailyStreak}), 0)`,
    })
    .from(gameSessions)
    .innerJoin(user, eq(user.id, gameSessions.userId))
    .leftJoin(streaks, eq(streaks.userId, gameSessions.userId))
    .where(and(isNotNull(gameSessions.userId), isNotNull(gameSessions.completedAt), gte(gameSessions.completedAt, since)))
    .groupBy(gameSessions.userId, user.name)
    .orderBy(desc(sql`sum(${gameSessions.score})`));

  return rows.map((r, i) => ({
    userId: r.userId as string,
    displayName: r.displayName ?? "Anonymous",
    score: r.score,
    wordsMastered: null,
    currentDailyStreak: r.currentDailyStreak,
    rank: i + 1,
  }));
}

export async function getWeeklyLeaderboard(limit = DEFAULT_LIMIT): Promise<LeaderboardRow[]> {
  return (await computeWeeklyRanked()).slice(0, limit);
}

/** Reads the materialized table (blueprint §3), refreshed periodically by `refreshLeaderboard()`. */
export async function getAllTimeLeaderboard(limit = DEFAULT_LIMIT): Promise<LeaderboardRow[]> {
  const rows = await db
    .select({
      userId: leaderboard.userId,
      displayName: leaderboard.displayName,
      score: leaderboard.totalScore,
      wordsMastered: leaderboard.wordsMastered,
      rank: leaderboard.rankAlltime,
      currentDailyStreak: sql<number>`coalesce(${streaks.currentDailyStreak}, 0)`,
    })
    .from(leaderboard)
    .leftJoin(streaks, eq(streaks.userId, leaderboard.userId))
    .orderBy(asc(leaderboard.rankAlltime))
    .limit(limit);

  return rows.map((r) => ({ ...r, rank: r.rank ?? 0 }));
}

async function getAllTimeRankForUser(userId: string): Promise<LeaderboardRow | null> {
  const [row] = await db
    .select({
      userId: leaderboard.userId,
      displayName: leaderboard.displayName,
      score: leaderboard.totalScore,
      wordsMastered: leaderboard.wordsMastered,
      rank: leaderboard.rankAlltime,
      currentDailyStreak: sql<number>`coalesce(${streaks.currentDailyStreak}, 0)`,
    })
    .from(leaderboard)
    .leftJoin(streaks, eq(streaks.userId, leaderboard.userId))
    .where(eq(leaderboard.userId, userId))
    .limit(1);

  return row ? { ...row, rank: row.rank ?? 0 } : null;
}

/**
 * The view a `/leaderboard` request actually needs: a top page plus (for authed users) their own
 * row even when it falls outside that page — used identically by the SSR page and the
 * client-side tab-switch fetch (`/api/leaderboard`) so both stay in sync.
 */
export async function getLeaderboardView(
  range: "weekly" | "alltime",
  userId: string | undefined,
  limit = DEFAULT_LIMIT,
): Promise<LeaderboardView> {
  if (range === "weekly") {
    const ranked = await computeWeeklyRanked();
    const entries = ranked.slice(0, limit);
    const viewer = userId ? (ranked.find((r) => r.userId === userId) ?? null) : null;
    return { entries, viewer };
  }

  const entries = await getAllTimeLeaderboard(limit);
  const viewer = userId
    ? (entries.find((r) => r.userId === userId) ?? (await getAllTimeRankForUser(userId)))
    : null;
  return { entries, viewer };
}

/**
 * Recomputes the all-time leaderboard from source tables and replaces the materialized
 * `leaderboard` table (blueprint §3 risk note: avoids an `ORDER BY SUM()` over full session
 * history on every page view). Meant to run on a schedule — a Cloudflare Cron Trigger hitting
 * `/api/cron/refresh-leaderboard` in production (blueprint §14); see also `scripts/refresh-leaderboard.ts`.
 */
export async function refreshLeaderboard(): Promise<number> {
  const totals = await db
    .select({
      userId: gameSessions.userId,
      displayName: user.name,
      totalScore: sql<number>`sum(${gameSessions.score})`,
    })
    .from(gameSessions)
    .innerJoin(user, eq(user.id, gameSessions.userId))
    .where(and(isNotNull(gameSessions.userId), isNotNull(gameSessions.completedAt)))
    .groupBy(gameSessions.userId, user.name);

  const masteredCounts = await db
    .select({ userId: userWordStats.userId, n: sql<number>`count(*)` })
    .from(userWordStats)
    .where(inArray(userWordStats.mastery, ["Mastered", "Perfect"]))
    .groupBy(userWordStats.userId);
  const masteredMap = new Map(masteredCounts.map((m) => [m.userId, m.n]));

  const ranked = [...totals].sort((a, b) => b.totalScore - a.totalScore);

  await db.delete(leaderboard);
  if (ranked.length === 0) return 0;

  await db.insert(leaderboard).values(
    ranked.map((r, i) => ({
      userId: r.userId as string,
      displayName: r.displayName ?? "Anonymous",
      totalScore: r.totalScore,
      wordsMastered: masteredMap.get(r.userId as string) ?? 0,
      rankAlltime: i + 1,
      rankWeekly: null,
    })),
  );

  return ranked.length;
}
