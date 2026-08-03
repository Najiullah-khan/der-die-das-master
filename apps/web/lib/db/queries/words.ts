import { asc, eq } from "drizzle-orm";
import type { CefrLevel } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { words } from "@/lib/db/schema";

/**
 * Frequency-ordered batch for a new session. Weighting by the authenticated user's weak
 * words (blueprint §4) is a Phase 4 personalization layer — this covers the baseline path.
 */
export async function getWordBatch(level: CefrLevel, count: number) {
  return db.select().from(words).where(eq(words.cefrLevel, level)).orderBy(asc(words.frequencyRank)).limit(count);
}

export async function getWordById(id: number) {
  const [word] = await db.select().from(words).where(eq(words.id, id)).limit(1);
  return word ?? null;
}
