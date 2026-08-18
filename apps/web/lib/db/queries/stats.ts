import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userWordStats } from "@/lib/db/schema";

export async function getUserWordStat(userId: string, wordId: number) {
  const [stat] = await db
    .select()
    .from(userWordStats)
    .where(and(eq(userWordStats.userId, userId), eq(userWordStats.wordId, wordId)))
    .limit(1);
  return stat ?? null;
}
