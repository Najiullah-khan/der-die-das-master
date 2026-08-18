import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { LeaderboardResponse } from "@ddd/shared";
import { getLeaderboardView } from "@/lib/db/queries/leaderboard";
import { getCurrentUser } from "@/lib/auth/session";

const querySchema = z.object({ range: z.enum(["weekly", "alltime"]).default("alltime") });

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const { range } = parsed.data;

  const currentUser = await getCurrentUser(request.headers);
  const { entries, viewer } = await getLeaderboardView(range, currentUser?.id);

  const body: LeaderboardResponse = {
    range,
    entries: entries.map((r) => ({
      rank: r.rank,
      userId: r.userId,
      displayName: r.displayName,
      score: r.score,
      wordsMastered: r.wordsMastered,
      currentDailyStreak: r.currentDailyStreak,
    })),
    viewer: viewer
      ? {
          rank: viewer.rank,
          userId: viewer.userId,
          displayName: viewer.displayName,
          score: viewer.score,
          wordsMastered: viewer.wordsMastered,
          currentDailyStreak: viewer.currentDailyStreak,
        }
      : null,
  };
  return NextResponse.json(body);
}
