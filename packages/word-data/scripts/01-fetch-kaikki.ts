import { createWriteStream, existsSync, statSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, "../raw");
const OUT_FILE = path.join(RAW_DIR, "kaikki-german.jsonl");
const SOURCE_URL =
  "https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl";

/** Minimum plausible size for a complete download; guards against a truncated/failed fetch being treated as cached. */
const MIN_EXPECTED_BYTES = 500 * 1024 * 1024;

async function main() {
  await mkdir(RAW_DIR, { recursive: true });

  if (existsSync(OUT_FILE) && statSync(OUT_FILE).size > MIN_EXPECTED_BYTES) {
    console.log(`[01] Cached dump already present at ${OUT_FILE}, skipping download.`);
    return;
  }

  console.log(`[01] Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }

  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(OUT_FILE));

  const finalSize = statSync(OUT_FILE).size;
  console.log(`[01] Done. Wrote ${(finalSize / 1024 / 1024).toFixed(1)}MB to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[01] Failed:", err);
  process.exit(1);
});
