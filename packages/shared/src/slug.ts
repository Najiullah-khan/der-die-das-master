import type { Article } from "./types";

/** Lowercase, hyphenated, ASCII slug (German umlauts transliterated), e.g. "10 Rules for Genders!" -> "10-rules-for-genders". */
export function slugify(text: string): string {
  const transliterated = text
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");

  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deterministic slug for a noun's SEO page, e.g. ("der", "Hund") -> "der-hund", ("die", "Straße") -> "die-strasse". */
export function slugifyGermanNoun(article: Article, noun: string): string {
  return `${article}-${slugify(noun)}`;
}
