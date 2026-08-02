import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyGermanNoun, type Article, type CefrLevel } from "@ddd/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROCESSED_DIR = path.resolve(__dirname, "../processed");
const RAW_DIR = path.resolve(__dirname, "../raw");
const IN_FILE = path.join(PROCESSED_DIR, "nouns-raw.json");
const FREQ_FILE = path.join(RAW_DIR, "de-frequency.json");
const OUT_FILE = path.join(PROCESSED_DIR, "nouns-merged.json");

interface RawNoun {
  word: string;
  article: Article;
  plural: string;
  translation: string;
  exampleDe: string | null;
  exampleEn: string | null;
  exampleSource: "kaikki" | "tatoeba" | null;
  ipa: string | null;
  categories: string[];
  source: "kaikki";
}

export interface MergedNoun extends RawNoun {
  slug: string;
  frequencyRank: number | null;
  cefrLevel: CefrLevel;
}

/**
 * Rank thresholds for bucketing frequency rank -> CEFR level. Tunable: this is a
 * "best-effort levelling" heuristic (blueprint §16 risk notes), not a certified CEFR
 * mapping — no clean open CEFR dataset exists to calibrate against precisely.
 */
const CEFR_RANK_THRESHOLDS: [CefrLevel, number][] = [
  ["A1", 1200],
  ["A2", 3000],
  ["B1", 8000],
  ["B2", 15000],
  ["C1", 30000],
  ["C2", Infinity],
];

function bucketCefr(rank: number | null): CefrLevel {
  if (rank === null) return "C2";
  for (const [level, maxRank] of CEFR_RANK_THRESHOLDS) {
    if (rank <= maxRank) return level;
  }
  return "C2";
}

/**
 * Hand-curated top-tier A1 nouns. The frequency-based heuristic alone under- or
 * mis-ranks some of the most basic learner vocabulary (household items, family terms),
 * so per blueprint §6.2 step 2 we force these to A1 and give them a synthetic low rank
 * so they sort first within the level regardless of subtitle-frequency noise.
 */
const CURATED_A1_WORDS = [
  "Haus", "Wasser", "Kind", "Hund", "Katze", "Tisch", "Stuhl", "Buch", "Auto", "Schule",
  "Lehrer", "Lehrerin", "Freund", "Freundin", "Familie", "Mutter", "Vater", "Bruder", "Schwester",
  "Tag", "Nacht", "Jahr", "Zeit", "Stadt", "Land", "Straße", "Zimmer", "Fenster", "Tür",
  "Bett", "Küche", "Bad", "Garten", "Baum", "Blume", "Sonne", "Mond", "Stern", "Himmel",
  "Regen", "Schnee", "Wind", "Feuer", "Erde", "Berg", "Fluss", "See", "Meer", "Wald",
  "Brot", "Milch", "Apfel", "Ei", "Fleisch", "Fisch", "Gemüse", "Obst", "Kaffee", "Tee",
  "Bier", "Wein", "Zucker", "Salz", "Geld", "Arbeit", "Beruf", "Büro", "Computer", "Telefon",
  "Bus", "Zug", "Flugzeug", "Fahrrad", "Tasche", "Koffer", "Kleidung", "Hemd", "Hose", "Schuh",
  "Mantel", "Hut", "Brille", "Uhr", "Ring", "Arzt", "Ärztin", "Krankenhaus", "Polizei", "Post",
  "Bank", "Geschäft", "Markt", "Restaurant", "Hotel", "Bahnhof", "Flughafen", "Universität",
  "Sprache", "Wort", "Satz", "Frage", "Antwort", "Problem", "Musik", "Film", "Zeitung", "Bild",
  "Foto", "Farbe", "Licht", "Luft", "Papier", "Stift", "Tasse", "Teller", "Glas", "Messer",
  "Gabel", "Löffel", "Sofa", "Schrank", "Spiegel", "Lampe", "Kissen", "Decke", "Name", "Adresse",
  "Nummer", "Person", "Mann", "Frau", "Mädchen", "Junge", "Baby", "Woche", "Monat", "Stunde",
  "Minute", "Morgen", "Abend", "Mittag", "Wetter", "Reise", "Urlaub", "Koch", "Köchin", "Kellner",
];

async function main() {
  const raw: RawNoun[] = JSON.parse(await readFile(IN_FILE, "utf-8"));
  const freq: Record<string, number> = JSON.parse(await readFile(FREQ_FILE, "utf-8"));
  const curated = new Set(CURATED_A1_WORDS);

  const merged: MergedNoun[] = raw.map((noun) => {
    const rank = freq[noun.word.toLowerCase()] ?? null;
    const isCurated = curated.has(noun.word);
    return {
      ...noun,
      slug: slugifyGermanNoun(noun.article, noun.word),
      frequencyRank: isCurated ? 0 : rank,
      cefrLevel: isCurated ? "A1" : bucketCefr(rank),
    };
  });

  const missedCurated = [...curated].filter((w) => !raw.some((n) => n.word === w));
  if (missedCurated.length) {
    console.warn(`[04] ${missedCurated.length} curated A1 words not found in parsed dataset:`, missedCurated);
  }

  merged.sort((a, b) => (a.frequencyRank ?? Infinity) - (b.frequencyRank ?? Infinity));

  const byLevel = merged.reduce<Record<string, number>>((acc, n) => {
    acc[n.cefrLevel] = (acc[n.cefrLevel] ?? 0) + 1;
    return acc;
  }, {});

  await writeFile(OUT_FILE, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`[04] Merged ${merged.length} nouns with frequency + CEFR bucket.`);
  console.log("[04] CEFR distribution:", byLevel);
  console.log(`[04] Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[04] Failed:", err);
  process.exit(1);
});
