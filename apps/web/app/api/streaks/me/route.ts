import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import type { StreakSummary } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { streaks } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { initialStreakState } from "@/lib/game-engine/streaks";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const [row] = await db.select().from(streaks).where(eq(streaks.userId, user.id)).limit(1);

  const summary: StreakSummary = row
    ? {
        currentDailyStreak: row.currentDailyStreak,
        highestDailyStreak: row.highestDailyStreak,
        currentSessionStreak: row.currentSessionStreak,
        highestSessionStreak: row.highestSessionStreak,
        lastPlayedDate: row.lastPlayedDate,
      }
    : initialStreakState();

  return NextResponse.json(summary);
}
