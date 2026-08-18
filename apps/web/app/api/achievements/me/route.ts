import { NextResponse, type NextRequest } from "next/server";
import type { AchievementsResponse, AchievementStatus } from "@ddd/shared";
import { ACHIEVEMENTS } from "@/lib/game-engine/achievements";
import { getUnlockedAchievements } from "@/lib/db/queries/achievements";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const unlocked = await getUnlockedAchievements(user.id);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  const achievements: AchievementStatus[] = ACHIEVEMENTS.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlockedAt: unlockedMap.get(a.id)?.getTime() ?? null,
  }));

  const body: AchievementsResponse = { achievements };
  return NextResponse.json(body);
}
