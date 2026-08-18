import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Word } from "@ddd/shared";
import type { NounWithEmoji } from "./06-assign-emoji.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROCESSED_DIR = path.resolve(__dirname, "../processed");
const IN_FILE = path.join(PROCESSED_DIR, "nouns-with-emoji.json");
const OUT_FILE = path.join(PROCESSED_DIR, "nouns.json");
const REVIEW_FILE = path.join(PROCESSED_DIR, "review-queue.json");

/** Ships A1-B2 (B2 level unlock); C1-C2 stay cached in nouns-with-emoji.json for a later unlock. */
const MVP_LEVELS = new Set(["A1", "A2", "B1", "B2"]);

function validate(n: NounWithEmoji): string[] {
  const errors: string[] = [];
  if (!["der", "die", "das"].includes(n.article)) errors.push("invalid article");
  if (!n.plural || !n.plural.trim()) errors.push("empty plural");
  if (!n.translation || !n.translation.trim()) errors.push("empty translation");
  if (!n.slug || !n.slug.trim()) errors.push("empty slug");
  if (n.emojiSource !== "placeholder" && !n.emoji) errors.push("missing emoji for non-placeholder source");
  return errors;
}

function toWord(n: NounWithEmoji): Word {
  return {
    noun: n.word,
    slug: n.slug,
    article: n.article,
    plural: n.plural,
    emoji: n.emoji,
    emojiSource: n.emojiSource,
    translation: n.translation,
    cefrLevel: n.cefrLevel,
    exampleDe: n.exampleDe,
    exampleEn: n.exampleEn,
    exampleSource: n.exampleSource,
    pronunciation: n.ipa,
    frequencyRank: n.frequencyRank,
    source: n.source,
  };
}

async function main() {
  const all: NounWithEmoji[] = JSON.parse(await readFile(IN_FILE, "utf-8"));
  const candidates = all.filter((n) => MVP_LEVELS.has(n.cefrLevel));

  const valid: Word[] = [];
  const rejected: { word: string; errors: string[] }[] = [];

  for (const n of candidates) {
    const errors = validate(n);
    if (errors.length === 0) {
      valid.push(toWord(n));
    } else {
      rejected.push({ word: n.word, errors });
    }
  }

  // Dedup by slug (should already be unique post-word-dedup, but guards against any
  // article/casing collision producing the same SEO slug).
  const bySlug = new Map<string, Word>();
  for (const w of valid) {
    if (!bySlug.has(w.slug)) bySlug.set(w.slug, w);
    else rejected.push({ word: w.noun, errors: ["duplicate slug"] });
  }
  const final = [...bySlug.values()];

  await writeFile(OUT_FILE, JSON.stringify(final, null, 2), "utf-8");
  await writeFile(REVIEW_FILE, JSON.stringify(rejected, null, 2), "utf-8");

  const byLevel = final.reduce<Record<string, number>>((acc, w) => {
    acc[w.cefrLevel] = (acc[w.cefrLevel] ?? 0) + 1;
    return acc;
  }, {});
  const byEmojiSource = final.reduce<Record<string, number>>((acc, w) => {
    acc[w.emojiSource] = (acc[w.emojiSource] ?? 0) + 1;
    return acc;
  }, {});
  const withExample = final.filter((w) => w.exampleDe).length;

  console.log(`[07] Dataset: ${final.length} words (levels: ${[...MVP_LEVELS].join(", ")}). ${rejected.length} rejected to review queue.`);
  console.log("[07] By level:", byLevel);
  console.log("[07] By emoji source:", byEmojiSource);
  console.log(`[07] ${withExample}/${final.length} have an example sentence.`);
  console.log(`[07] Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[07] Failed:", err);
  process.exit(1);
});
