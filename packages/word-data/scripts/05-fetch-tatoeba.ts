import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MergedNoun } from "./04-merge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROCESSED_DIR = path.resolve(__dirname, "../processed");
const IN_FILE = path.join(PROCESSED_DIR, "nouns-merged.json");
const OUT_FILE = IN_FILE; // enrich in place

const API_BASE = "https://api.tatoeba.org/unstable/sentences";
const REQUEST_DELAY_MS = 120; // stay well under Tatoeba's fair-use rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchExample(word: string): Promise<{ de: string; en: string } | null> {
  const url = `${API_BASE}?lang=deu&q=${encodeURIComponent(word)}&sort=relevance&limit=5&trans%3Alang=eng&trans%3Ais_direct=yes`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const json: any = await res.json();
      for (const sentence of json.data ?? []) {
        const text: string = sentence.text;
        const translation = sentence.translations?.[0]?.text;
        if (!text || !translation) continue;
        if (text.length > 160) continue;
        // Cheap sanity check: the sentence should actually contain the lemma (case-insensitive, ignoring umlauts noise is fine to skip).
        if (!text.toLowerCase().includes(word.toLowerCase())) continue;
        return { de: text, en: translation };
      }
      return null;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await sleep(attempt * 500); // transient-network backoff
    }
  }
  throw lastErr;
}

async function main() {
  const nouns: MergedNoun[] = JSON.parse(await readFile(IN_FILE, "utf-8"));

  // Only the MVP-shipped levels (A1-B1) need an example sentence badly enough to spend
  // API calls on; higher levels stay dormant until a future level unlock.
  const candidates = nouns.filter(
    (n) => !n.exampleDe && (n.cefrLevel === "A1" || n.cefrLevel === "A2" || n.cefrLevel === "B1"),
  );

  console.log(`[05] ${candidates.length} A1-B1 nouns missing an example sentence; querying Tatoeba...`);

  let filled = 0;
  for (let i = 0; i < candidates.length; i++) {
    const noun = candidates[i];
    try {
      const example = await fetchExample(noun.word);
      if (example) {
        noun.exampleDe = example.de;
        noun.exampleEn = example.en;
        noun.exampleSource = "tatoeba";
        filled++;
      }
    } catch (err) {
      console.warn(`[05] Lookup failed for "${noun.word}":`, (err as Error).message);
    }
    if (i % 100 === 0) {
      console.log(`[05] ${i}/${candidates.length} (${filled} filled)`);
      await writeFile(OUT_FILE, JSON.stringify(nouns, null, 2), "utf-8"); // checkpoint
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await writeFile(OUT_FILE, JSON.stringify(nouns, null, 2), "utf-8");
  console.log(`[05] Filled ${filled}/${candidates.length} missing examples via Tatoeba.`);
  console.log(`[05] Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[05] Failed:", err);
  process.exit(1);
});
