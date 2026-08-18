import { NextResponse, type NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gameSessions, sessionAttempts, settings, streaks, user, userAchievements, userWordStats } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

/** GDPR data export (blueprint §10: `/api/account/export`) — everything we hold, keyed by table. */
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser(request.headers);
  if (!currentUser) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit("account:export", currentUser.id, 5);
  if (!allowed) return rateLimitResponse();

  const userId = currentUser.id;

  const [profile, sessions, wordStats, streak, achievements, userSettings] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(gameSessions).where(eq(gameSessions.userId, userId)),
    db.select().from(userWordStats).where(eq(userWordStats.userId, userId)),
    db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
    db.select().from(settings).where(eq(settings.userId, userId)).limit(1).then((r) => r[0] ?? null),
  ]);

  const sessionIds = sessions.map((s) => s.id);
  const attempts =
    sessionIds.length > 0 ? await db.select().from(sessionAttempts).where(inArray(sessionAttempts.sessionId, sessionIds)) : [];

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile,
    sessions,
    sessionAttempts: attempts,
    wordStats,
    streak,
    achievements,
    settings: userSettings,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="der-die-das-master-export.json"`,
    },
  });
}
