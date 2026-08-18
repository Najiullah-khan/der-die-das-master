import { and, asc, eq, gt, isNull, like, notInArray, or, sql } from "drizzle-orm";
import type { Article, CefrLevel, CodexMasteryFilter } from "@ddd/shared";
import { db } from "@/lib/db/client";
import { userWordStats, wordRelations, words } from "@/lib/db/schema";

/**
 * Frequency-ordered batch for a new session. Weighting by the authenticated user's weak
 * words (blueprint §4) is a Phase 4 personalization layer — this covers the baseline path.
 */
export async function getWordBatch(level: CefrLevel, count: number, offset = 0) {
  return db
    .select()
    .from(words)
    .where(eq(words.cefrLevel, level))
    .orderBy(asc(words.frequencyRank))
    .limit(count)
    .offset(offset);
}

export async function getWordCount(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(words);
  return row?.n ?? 0;
}

/** A single, well-known A1 word for the landing page's decorative demo card — not a real session. */
export async function getDemoWord() {
  const [word] = await db.select().from(words).where(eq(words.cefrLevel, "A1")).orderBy(asc(words.frequencyRank)).limit(1);
  return word ?? null;
}

export async function getWordById(id: number) {
  const [word] = await db.select().from(words).where(eq(words.id, id)).limit(1);
  return word ?? null;
}

export async function getWordBySlug(slug: string) {
  const [word] = await db.select().from(words).where(eq(words.slug, slug)).limit(1);
  return word ?? null;
}

/** All slugs for one article — `generateStaticParams` source for `/der/[noun]` etc. */
export async function getWordSlugsByArticle(article: Article) {
  return db.select({ slug: words.slug }).from(words).where(eq(words.article, article));
}

/** Top (highest-frequency) nouns for an article+level pair — article hub word lists. */
export async function getTopWordsByArticleAndLevel(article: Article, level: CefrLevel, limit: number) {
  return db
    .select()
    .from(words)
    .where(and(eq(words.article, article), eq(words.cefrLevel, level)))
    .orderBy(asc(words.frequencyRank))
    .limit(limit);
}

export async function getWordCountByArticle(article: Article): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(words).where(eq(words.article, article));
  return row?.n ?? 0;
}

/** Top (highest-frequency) nouns for a CEFR level — level hub word lists. */
export async function getTopWordsByLevel(level: CefrLevel, limit: number) {
  return db.select().from(words).where(eq(words.cefrLevel, level)).orderBy(asc(words.frequencyRank)).limit(limit);
}

export async function getWordCountByLevel(level: CefrLevel): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(words).where(eq(words.cefrLevel, level));
  return row?.n ?? 0;
}

/**
 * "Related nouns" for SEO internal linking (blueprint §8.1). Prioritizes genuine
 * `word_relations.relation_type = 'same_topic'` matches (curated vocabulary groups — see
 * scripts/seed-word-relations.ts — not every word has these) before falling back to the
 * same-article + same-level pool to fill out the rest. Same-article fallback still reinforces
 * the gender pattern the learner is trying to internalize, which is the point of the page.
 */
export async function getRelatedWords(word: { id: number; article: Article; cefrLevel: CefrLevel }, limit = 6) {
  const topicRows = await db
    .select({ word: words })
    .from(wordRelations)
    .innerJoin(words, eq(words.id, wordRelations.relatedWordId))
    .where(and(eq(wordRelations.wordId, word.id), eq(wordRelations.relationType, "same_topic")))
    .orderBy(asc(words.frequencyRank))
    .limit(limit);
  const topicWords = topicRows.map((r) => r.word);

  if (topicWords.length >= limit) return topicWords;

  const excludeIds = [word.id, ...topicWords.map((w) => w.id)];
  const fallbackWords = await db
    .select()
    .from(words)
    .where(and(eq(words.article, word.article), eq(words.cefrLevel, word.cefrLevel), notInArray(words.id, excludeIds)))
    .orderBy(asc(words.frequencyRank))
    .limit(limit - topicWords.length);

  return [...topicWords, ...fallbackWords];
}

export interface SearchWordsParams {
  search?: string;
  level?: CefrLevel;
  /** Only meaningful (and only applied) when `userId` is set — guests have no server-side stats. */
  masteryFilter?: CodexMasteryFilter;
  userId?: string;
  limit: number;
  offset: number;
}

/**
 * Paginated Codex search (blueprint §4 `GET /api/codex`). Always left-joins the caller's own
 * `userWordStats` row (a no-op join predicate when logged out) so results carry per-word
 * mastery for authed users without a second round-trip, and so the `masteryFilter` can be
 * expressed as a plain SQL condition on the joined row.
 *
 * `masteryFilter` groups raw per-word `Mastery` values into four coarser buckets (Codex mastery
 * filter upgrade) rather than matching the `Mastery` enum 1:1 — a word with no `userWordStats`
 * row at all (never attempted) is indistinguishable from `eq(mastery, "Never Seen")`, since that
 * literal value is never actually stored (`calculateMastery` only returns it for 0 attempts,
 * which never gets written), so "never seen" has to be expressed as "no matching joined row".
 */
export async function searchWords(params: SearchWordsParams) {
  const { search, level, masteryFilter, userId, limit, offset } = params;

  const conditions = [];
  if (level) conditions.push(eq(words.cefrLevel, level));
  if (search && search.trim()) {
    const pattern = `%${search.trim().toLowerCase()}%`;
    conditions.push(or(like(sql`lower(${words.noun})`, pattern), like(sql`lower(${words.translation})`, pattern)));
  }
  if (userId && masteryFilter && masteryFilter !== "any") {
    if (masteryFilter === "never_seen") {
      conditions.push(or(isNull(userWordStats.wordId), eq(userWordStats.attempts, 0)));
    } else if (masteryFilter === "discovered") {
      conditions.push(gt(userWordStats.attempts, 0));
    } else {
      // struggled: accuracy < 60% or already labeled "Struggled" by calculateMastery (whose own
      // threshold is < 50% — this filter is intentionally a bit broader, catching "Learning"
      // words that are still shakier than 60% too).
      conditions.push(
        and(
          gt(userWordStats.attempts, 0),
          or(
            sql`CAST(${userWordStats.correct} AS REAL) / ${userWordStats.attempts} < 0.6`,
            eq(userWordStats.mastery, "Struggled"),
          ),
        ),
      );
    }
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const statsJoin = userId ? and(eq(userWordStats.wordId, words.id), eq(userWordStats.userId, userId)) : sql`0`;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ word: words, stats: userWordStats })
      .from(words)
      .leftJoin(userWordStats, statsJoin)
      .where(where)
      .orderBy(asc(words.frequencyRank))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)` })
      .from(words)
      .leftJoin(userWordStats, statsJoin)
      .where(where),
  ]);

  return { rows, total };
}
