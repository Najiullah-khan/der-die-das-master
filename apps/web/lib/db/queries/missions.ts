import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts } from "@/lib/db/schema";

const DAILY_MISSION_GOAL = 10;

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface DailyMission {
  label: string;
  progress: number;
  goal: number;
  complete: boolean;
}

/** "Practice N words today" — the single daily mission card (blueprint §11: one simple mission, no nagging popups). */
export async function getTodayMission(userId: string): Promise<DailyMission> {
  const since = startOfTodayUTC();
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(sessionAttempts)
    .innerJoin(gameSessions, eq(gameSessions.id, sessionAttempts.sessionId))
    .where(and(eq(gameSessions.userId, userId), gte(sessionAttempts.answeredAt, since)));

  const attempted = row?.n ?? 0;
  return {
    label: `Practice ${DAILY_MISSION_GOAL} words today`,
    progress: Math.min(attempted, DAILY_MISSION_GOAL),
    goal: DAILY_MISSION_GOAL,
    complete: attempted >= DAILY_MISSION_GOAL,
  };
}
