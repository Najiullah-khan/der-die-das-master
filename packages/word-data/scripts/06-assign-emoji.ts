import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MergedNoun } from "./04-merge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROCESSED_DIR = path.resolve(__dirname, "../processed");
const IN_FILE = path.join(PROCESSED_DIR, "nouns-merged.json");
const OUT_FILE = path.join(PROCESSED_DIR, "nouns-with-emoji.json");
const CURATED_MAP_FILE = path.resolve(__dirname, "../emoji-map.json");

export interface NounWithEmoji extends MergedNoun {
  emoji: string;
  emojiSource: "curated" | "category" | "placeholder";
}

/** Kaikki category name (substring match) -> representative emoji, for concrete nouns the curated map missed. */
const CATEGORY_EMOJI: [RegExp, string][] = [
  [/\bdogs?\b|canids?/i, "🐕"],
  [/\bcats?\b|felines?/i, "🐈"],
  [/\bbirds?\b/i, "🐦"],
  [/\bfish(es)?\b/i, "🐟"],
  [/\binsects?\b/i, "🐛"],
  [/\bfruits?\b/i, "🍎"],
  [/\bvegetables?\b/i, "🥕"],
  [/\btrees?\b/i, "🌳"],
  [/\bflowers?\b/i, "🌸"],
  [/\bcolors?\b|colours?/i, "🎨"],
  [/\bmusic(al)?\b|instruments?/i, "🎵"],
  [/\bsports?\b/i, "⚽"],
  [/\bclothing\b|garments?/i, "👕"],
  [/\bbuildings?\b|architecture/i, "🏢"],
  [/\bfurniture\b/i, "🪑"],
  [/\bvehicles?\b|automobiles?/i, "🚗"],
  [/\bweather\b/i, "🌤️"],
  [/\bemotions?\b/i, "😊"],
  [/\boccupations?\b|professions?/i, "💼"],
  [/\bchemistry\b|physics\b|biology\b|mathematics\b/i, "🔬"],
  [/\bmedicine\b|medical\b|anatomy\b/i, "🩺"],
  [/\bmoney\b|currency|finance/i, "💰"],
  [/\btime\b/i, "⏰"],
];

/** German abstract-noun suffixes: no concrete referent, so a "thought" glyph reads better than a placeholder. */
const ABSTRACT_SUFFIX_RE = /(heit|keit|ung|schaft|tum|nis)$/;

function assignEmoji(
  noun: MergedNoun,
  curated: Record<string, string>,
): { emoji: string; emojiSource: NounWithEmoji["emojiSource"] } {
  const curatedEmoji = curated[noun.word];
  if (curatedEmoji) return { emoji: curatedEmoji, emojiSource: "curated" };

  for (const [pattern, emoji] of CATEGORY_EMOJI) {
    if (noun.categories.some((c) => pattern.test(c))) {
      return { emoji, emojiSource: "category" };
    }
  }

  if (ABSTRACT_SUFFIX_RE.test(noun.word)) {
    return { emoji: "💭", emojiSource: "category" };
  }

  // Nothing fits — frontend renders an article-colored geometric placeholder + the word itself (blueprint §7).
  return { emoji: "", emojiSource: "placeholder" };
}

async function main() {
  const nouns: MergedNoun[] = JSON.parse(await readFile(IN_FILE, "utf-8"));
  const curated: Record<string, string> = JSON.parse(await readFile(CURATED_MAP_FILE, "utf-8"));

  const withEmoji: NounWithEmoji[] = nouns.map((noun) => ({
    ...noun,
    ...assignEmoji(noun, curated),
  }));

  const bySource = withEmoji.reduce<Record<string, number>>((acc, n) => {
    acc[n.emojiSource] = (acc[n.emojiSource] ?? 0) + 1;
    return acc;
  }, {});

  await writeFile(OUT_FILE, JSON.stringify(withEmoji, null, 2), "utf-8");
  console.log("[06] Emoji assignment breakdown:", bySource);
  console.log(`[06] Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[06] Failed:", err);
  process.exit(1);
});
