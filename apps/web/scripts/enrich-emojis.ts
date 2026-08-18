import { eq, inArray } from "drizzle-orm";
import { db } from "../lib/db/client";
import { words } from "../lib/db/schema";
import { PLAYABLE_LEVELS } from "../lib/game-engine/levels";

/**
 * Bulk emoji enrichment for every seeded word A1-B2 (blueprint §7 Emoji Strategy). The pipeline's
 * own assignment step (packages/word-data/scripts/06-assign-emoji.ts) already ran once at seed
 * time using Kaikki's semantic "categories" metadata — but that metadata isn't persisted to the
 * `words` table, so it can't be re-derived here. This script instead works directly off what
 * *is* in the DB (the German noun itself + its English translation), as a second, complementary
 * pass over whatever it left as an empty "placeholder" (blueprint §7 tertiary fallback — the
 * branded der/die/das icon the UI renders client-side via `<WordEmoji>` when `emoji` is empty).
 *
 * Only assigns a real, contextual emoji match (a specific word stem, or a genuine topical
 * category keyword) — words with no such match are left with `emoji: ""` on purpose, so they
 * render the branded fallback icon rather than a generic/unrelated glyph (vocabulary card
 * rendering upgrade). This used to also assign a grammatical-pattern-based glyph (💡 for any
 * abstract-suffix noun, 👤 for any person-suffix noun) and a universal last-resort (📖) for
 * everything else — removed, since neither is actually *contextual* to the specific word, which
 * is the whole point of showing an emoji instead of the fallback icon in the first place.
 *
 * Idempotent: rows that already carry a valid non-empty emoji are left untouched (and don't
 * generate an UPDATE). The one exception is the one-time sweep below, which clears out emoji
 * values assigned by the old (removed) generic tiers so those words become eligible for
 * re-evaluation under the new, stricter rules instead of keeping a stale generic glyph forever.
 */

const BATCH_SIZE = 500;

// One-time cleanup: glyphs the old generic suffix/universal-fallback tiers used to assign.
// Clearing these lets affected words fall through to the branded icon (or a genuine Tier 1/2
// match, if the word also happens to hit one) instead of keeping a non-contextual leftover.
const STALE_GENERIC_EMOJI = ["💡", "👤", "📖"];

// ---------------------------------------------------------------------------
// Tier 1 — specific word match: curated stems for common nouns the pipeline's Kaikki-category
// pass tends to miss (mostly abstract nouns with no Wiktionary "categories" tag at all). Matched
// as a case-insensitive substring against the noun, so compounds match too (e.g. "Arbeitszeit"
// still hits "arbeit") — every stem here is long/specific enough to avoid stray false positives.
// ---------------------------------------------------------------------------
const STEM_EMOJI: [string, string][] = [
  ["arbeit", "💼"],
  ["geld", "💰"],
  ["zeit", "⏰"],
  ["freund", "👥"],
  ["musik", "🎵"],
  ["familie", "👪"],
  ["schule", "🏫"],
  ["liebe", "❤️"],
  ["essen", "🍽️"],
  ["wasser", "💧"],
  ["feuer", "🔥"],
  ["licht", "💡"],
  ["sonne", "☀️"],
  ["mond", "🌙"],
  ["stern", "⭐"],
  ["buch", "📖"],
  ["brief", "✉️"],
  ["auto", "🚗"],
  ["reise", "✈️"],
  ["sprache", "🗣️"],
  ["frage", "❓"],
  ["antwort", "💬"],
  ["idee", "💡"],
  ["traum", "💭"],
  ["angst", "😨"],
  ["freude", "😄"],
  ["sport", "⚽"],
  ["spiel", "🎮"],
  ["kunst", "🎨"],
  ["farbe", "🎨"],
];

// ---------------------------------------------------------------------------
// Tier 2 — genuine topical category match (a real emoji tied to what the word is actually
// about, not a grammatical-pattern guess). Checked once Tier 1 finds nothing.
// ---------------------------------------------------------------------------
const CATEGORY_KEYWORDS: { pattern: RegExp; emoji: string }[] = [
  {
    // Business/Financial
    pattern:
      /\b(bank|finanz|wirtschaft|handel|markt|steuer|kredit|aktie|konto|unternehmen|firma|industrie|business|trade|tax|market|finance|economy|company)\b/i,
    emoji: "📊",
  },
  {
    // Nature/Environment
    pattern:
      /\b(natur|umwelt|wald|baum|pflanze|tier|berg|fluss|meer|blume|garten|erde|klima|nature|environment|forest|plant|animal|mountain|river|climate)\b/i,
    emoji: "🌱",
  },
  {
    // Time/Calendar
    pattern: /\b(kalender|monat|woche|jahr|stunde|minute|termin|datum|calendar|month|week|year|hour|minute|schedule)\b/i,
    emoji: "🗓️",
  },
  {
    // Health/Medical
    pattern:
      /\b(gesundheit|krankheit|krankenhaus|klinik|medizin|therapie|arzt|health|medical|illness|disease|hospital|medicine|therapy|clinic)\b/i,
    emoji: "🩺",
  },
];

type EmojiSource = "curated" | "category" | "placeholder";

interface Resolution {
  emoji: string;
  emojiSource: EmojiSource;
}

/** No match → emoji "" / "placeholder", meaning the UI renders the branded fallback icon. */
function resolveEmoji(noun: string, translation: string): Resolution {
  const lowerNoun = noun.toLowerCase();

  for (const [stem, emoji] of STEM_EMOJI) {
    if (lowerNoun.includes(stem)) return { emoji, emojiSource: "curated" };
  }

  const haystack = `${noun} ${translation}`;
  for (const { pattern, emoji } of CATEGORY_KEYWORDS) {
    if (pattern.test(haystack)) return { emoji, emojiSource: "category" };
  }

  return { emoji: "", emojiSource: "placeholder" };
}

async function main() {
  const staleCount = await db
    .update(words)
    .set({ emoji: "", emojiSource: "placeholder" })
    .where(inArray(words.emoji, STALE_GENERIC_EMOJI))
    .returning({ id: words.id })
    .then((rows) => rows.length);
  if (staleCount > 0) {
    console.log(`Cleared ${staleCount} stale generic-fallback emoji(s) for re-evaluation.`);
  }

  const rows = await db
    .select({ id: words.id, noun: words.noun, emoji: words.emoji, translation: words.translation })
    .from(words)
    .where(inArray(words.cefrLevel, PLAYABLE_LEVELS));

  console.log(`Loaded ${rows.length} words across ${PLAYABLE_LEVELS.join(", ")}.`);

  let alreadySet = 0;
  let curated = 0;
  let category = 0;
  let leftAsFallback = 0;
  const updates: { id: number; emoji: string; emojiSource: EmojiSource }[] = [];

  for (const row of rows) {
    if (row.emoji && row.emoji.trim().length > 0) {
      alreadySet++;
      continue;
    }

    const resolved = resolveEmoji(row.noun, row.translation);
    if (resolved.emojiSource === "curated") curated++;
    else if (resolved.emojiSource === "category") category++;
    else leftAsFallback++;

    updates.push({ id: row.id, emoji: resolved.emoji, emojiSource: resolved.emojiSource });
  }

  console.log(`${updates.length} word(s) evaluated; ${alreadySet} already had a valid emoji.`);

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((u) => db.update(words).set({ emoji: u.emoji, emojiSource: u.emojiSource }).where(eq(words.id, u.id))),
    );
    console.log(`  updated ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
  }

  console.log("\n=== Emoji enrichment summary ===");
  console.log(`Total words processed (A1-B2): ${rows.length}`);
  console.log(`Already had a valid emoji: ${alreadySet}`);
  console.log(`Specific word-stem match (curated): ${curated}`);
  console.log(`Topical category match: ${category}`);
  console.log(`No meaningful match — left empty for the branded fallback icon: ${leftAsFallback}`);
  console.log(`Rows updated in the database: ${updates.length}`);
}

main().catch((err) => {
  console.error("Emoji enrichment failed:", err);
  process.exit(1);
});
