import type { Article } from "@ddd/shared";

/** Strips the `${article}-` prefix every word slug is built with (packages/word-data's merge
 * step always produces `slug = article + "-" + transliterated(noun)`), leaving the segment used
 * as the dynamic `[noun]` param under `/der`, `/die`, `/das`. */
export function nounSlugOf(word: { slug: string; article: Article }): string {
  return word.slug.slice(word.article.length + 1);
}

/** Canonical path for a word's detail page — `/der/tisch`, `/die/lampe`, `/das/haus`. */
export function wordPath(word: { slug: string; article: Article }): string {
  return `/${word.article}/${nounSlugOf(word)}`;
}
