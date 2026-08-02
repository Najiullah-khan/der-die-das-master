import type { Article } from "@ddd/shared";

const ARTICLE_COLOR: Record<Article, string> = {
  der: "#3b82f6", // blue
  die: "#ef4444", // red
  das: "#22c55e", // green
};

export interface ResolvedEmoji {
  kind: "emoji" | "placeholder";
  /** The emoji glyph, or empty string when kind === "placeholder". */
  glyph: string;
  /** Article-coded color + first letter, used by the UI when there's no emoji to show (blueprint §7 tertiary fallback). */
  placeholderColor: string;
  placeholderLetter: string;
}

export function resolveEmoji(noun: string, article: Article, emoji: string): ResolvedEmoji {
  const placeholderColor = ARTICLE_COLOR[article];
  const placeholderLetter = noun.charAt(0).toUpperCase();

  if (!emoji) {
    return { kind: "placeholder", glyph: "", placeholderColor, placeholderLetter };
  }
  return { kind: "emoji", glyph: emoji, placeholderColor, placeholderLetter };
}
