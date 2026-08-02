import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_FILE = path.resolve(__dirname, "../raw/kaikki-german.jsonl");
const OUT_DIR = path.resolve(__dirname, "../processed");
const OUT_FILE = path.join(OUT_DIR, "nouns-raw.json");

type Article = "der" | "die" | "das";

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

const GENDER_TO_ARTICLE: Record<string, Article> = {
  masculine: "der",
  feminine: "die",
  neuter: "das",
};

const BANNED_SENSE_TAGS = new Set([
  "alt-of",
  "abbreviation",
  "obsolete",
  "rare",
  "archaic",
  "misspelling",
  "initialism",
]);

/** When a sense lists more than one gender (regional/dialectal variation), prefer the statistically dominant one. */
const GENDER_PRIORITY = ["masculine", "feminine", "neuter"];

const META_CATEGORY_RE = /\bpages\b|\bentries\b|terms with|redlink|needing|missing|request|template|quotation|lemmas|\blinks\b/i;

function extractArticle(senses: any[]): Article | null {
  for (const sense of senses ?? []) {
    const tags: string[] = sense.tags ?? [];
    const genders = tags.filter((t) => t in GENDER_TO_ARTICLE);
    if (genders.length === 1) return GENDER_TO_ARTICLE[genders[0]];
    if (genders.length > 1) {
      const preferred = GENDER_PRIORITY.find((g) => genders.includes(g));
      if (preferred) return GENDER_TO_ARTICLE[preferred];
    }
  }
  return null;
}

function extractPlural(forms: any[]): string | null {
  if (!forms) return null;

  const canonical = forms.find(
    (f) => !f.source && Array.isArray(f.tags) && f.tags.includes("plural") && !f.tags.includes("genitive"),
  );
  if (canonical?.form) return canonical.form;

  const declension = forms.find(
    (f) =>
      f.source === "declension" &&
      Array.isArray(f.tags) &&
      f.tags.includes("plural") &&
      f.tags.includes("nominative") &&
      f.tags.includes("definite"),
  );
  if (declension?.form) {
    return declension.form.replace(/^(der|die|das)\s+/, "");
  }

  return null;
}

function isAcceptableSense(sense: any): boolean {
  const tags: string[] = sense.tags ?? [];
  if (tags.some((t) => BANNED_SENSE_TAGS.has(t))) return false;
  const gloss = sense.glosses?.[0];
  if (!gloss) return false;
  if (/^(form|plural|genitive|dative|accusative) of /i.test(gloss)) return false;
  return true;
}

/** Trims a verbose Wiktionary gloss down to its lead clause, e.g. "table (a piece of furniture...)" -> "table". */
function cleanTranslation(gloss: string): string {
  const parenIdx = gloss.indexOf(" (");
  if (parenIdx > 1) {
    const lead = gloss.slice(0, parenIdx).trim();
    if (lead.length >= 2) return lead;
  }
  return gloss.length > 100 ? gloss.slice(0, 100).trim() : gloss;
}

function extractTranslation(senses: any[]): string | null {
  for (const sense of senses ?? []) {
    if (isAcceptableSense(sense)) return cleanTranslation(sense.glosses[0]);
  }
  return null;
}

function extractExample(senses: any[]): { de: string; en: string } | null {
  for (const sense of senses ?? []) {
    for (const ex of sense.examples ?? []) {
      const text: string | undefined = ex.text;
      const translation: string | undefined = ex.translation ?? ex.english;
      if (!text || !translation) continue;
      if (text.length > 220 || text.split("\n").length > 2) continue;
      if (/please add/i.test(translation)) continue;
      return { de: text, en: translation };
    }
  }
  return null;
}

function extractCategories(senses: any[]): string[] {
  const names = new Set<string>();
  for (const sense of senses ?? []) {
    for (const cat of sense.categories ?? []) {
      if (cat.name && !META_CATEGORY_RE.test(cat.name)) names.add(cat.name);
    }
  }
  return [...names];
}

function isValidWord(word: string): boolean {
  // Capital letter followed by a lowercase letter rules out acronyms/abbreviations
  // (EU, AIDS, DNA, ...) while still accepting normal German nouns and compounds.
  return /^[A-ZÄÖÜ][a-zäöüß][a-zA-ZäöüßÄÖÜ-]*$/.test(word);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const rl = readline.createInterface({
    input: createReadStream(RAW_FILE),
    crlfDelay: Infinity,
  });

  const seen = new Set<string>();
  const nouns: RawNoun[] = [];
  let scanned = 0;
  let droppedNoGender = 0;
  let pluralFallbackCount = 0;
  let droppedNoTranslation = 0;
  let droppedInvalidWord = 0;
  let droppedDuplicate = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    let entry: any;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.pos !== "noun" || entry.lang !== "German") continue;

    scanned++;
    const word: string = entry.word;
    if (!word || !isValidWord(word)) {
      droppedInvalidWord++;
      continue;
    }
    if (seen.has(word)) {
      droppedDuplicate++;
      continue;
    }

    const article = extractArticle(entry.senses);
    if (!article) {
      droppedNoGender++;
      continue;
    }

    // Many uncountable/mass nouns (Wasser, Schnee, Fleisch...) genuinely have no listed
    // plural in Wiktionary; rather than dropping otherwise-good A1/A2 vocabulary, fall
    // back to the singular form (the common didactic convention for invariant nouns)
    // instead of treating "no plural found" as invalid.
    const extractedPlural = extractPlural(entry.forms);
    if (!extractedPlural) pluralFallbackCount++;
    const plural = extractedPlural ?? word;

    const translation = extractTranslation(entry.senses);
    if (!translation) {
      droppedNoTranslation++;
      continue;
    }

    const example = extractExample(entry.senses);
    const ipa = entry.sounds?.find((s: any) => typeof s.ipa === "string")?.ipa ?? null;
    const categories = extractCategories(entry.senses);

    seen.add(word);
    nouns.push({
      word,
      article,
      plural,
      translation,
      exampleDe: example?.de ?? null,
      exampleEn: example?.en ?? null,
      exampleSource: example ? "kaikki" : null,
      ipa,
      categories,
      source: "kaikki",
    });
  }

  await writeFile(OUT_FILE, JSON.stringify(nouns, null, 2), "utf-8");

  console.log(`[02] Scanned ${scanned} German noun entries.`);
  console.log(`[02] Kept ${nouns.length}.`);
  console.log(
    `[02] Dropped: noGender=${droppedNoGender} noTranslation=${droppedNoTranslation} invalidWord=${droppedInvalidWord} duplicate=${droppedDuplicate}`,
  );
  console.log(`[02] Plural fell back to singular form for ${pluralFallbackCount} invariant/mass nouns.`);
  console.log(`[02] Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[02] Failed:", err);
  process.exit(1);
});
