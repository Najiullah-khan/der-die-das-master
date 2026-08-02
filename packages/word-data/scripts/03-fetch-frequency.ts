import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, "../raw");
const OUT_FILE = path.join(RAW_DIR, "de-frequency.json");

/**
 * hermitdave/FrequencyWords German list (OpenSubtitles-derived) — used strictly as an
 * internal frequency/ranking signal for CEFR bucketing, never redistributed or shown to
 * users. This is exactly the use the blueprint's own source-evaluation table (§6.1)
 * whitelists for OpenSubtitles-derived lists.
 */
const SOURCE_URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt";

async function main() {
  await mkdir(RAW_DIR, { recursive: true });

  if (existsSync(OUT_FILE)) {
    console.log(`[03] Cached frequency list already present at ${OUT_FILE}, skipping download.`);
    return;
  }

  console.log(`[03] Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const text = await res.text();

  const rankByLowerWord = new Map<string, number>();
  let rank = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [word] = trimmed.split(" ");
    if (!word) continue;
    rank++;
    const lower = word.toLowerCase();
    if (!rankByLowerWord.has(lower)) rankByLowerWord.set(lower, rank);
  }

  await writeFile(OUT_FILE, JSON.stringify(Object.fromEntries(rankByLowerWord)), "utf-8");
  console.log(`[03] Wrote ${rankByLowerWord.size} frequency ranks to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[03] Failed:", err);
  process.exit(1);
});
