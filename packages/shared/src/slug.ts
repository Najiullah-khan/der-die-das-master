import type { Article } from "./types";

/** Deterministic slug for a noun's SEO page, e.g. ("der", "Hund") -> "der-hund", ("die", "Straße") -> "die-strasse". */
export function slugifyGermanNoun(article: Article, noun: string): string {
  const transliterated = noun
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");

  const cleaned = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${article}-${cleaned}`;
}
