import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userAchievements } from "@/lib/db/schema";

export async function getUnlockedAchievementIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  return new Set(rows.map((r) => r.achievementId));
}

export async function getUnlockedAchievements(userId: string) {
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function unlockAchievements(userId: string, ids: string[], unlockedAt: Date = new Date()): Promise<void> {
  if (ids.length === 0) return;
  await db
    .insert(userAchievements)
    .values(ids.map((achievementId) => ({ userId, achievementId, unlockedAt })))
    .onConflictDoNothing();
}
