import type { Article } from "@ddd/shared";

// White-text-on-color placeholder badges (blueprint §7 tertiary fallback) — these are Tailwind's
// blue/red/green-700 shades, not the more obvious -500/-600, because -500 measured well under
// WCAG's 3:1 minimum even for large bold text (green-500 was 2.28:1) and this fallback still
// needs to carry the der/die/das color-coding accessibly (blueprint §16/§17).
const ARTICLE_COLOR: Record<Article, string> = {
  der: "#1447e6", // blue-700
  die: "#c10007", // red-700
  das: "#008236", // green-700
};

// Matches a run of one-or-more codepoints that are *only* actual pictographic emoji plus the
// "glue" codepoints real emoji sequences are built from: variation selectors (️ U+FE0F/U+FE0E,
// e.g. ❤️), the ZWJ joiner (compound emoji like 👨‍👩‍👧), skin-tone modifiers (👍🏽), regional
// indicators (flag pairs like 🇩🇪), and emoji tag characters (subdivision flags). Deliberately
// narrower than the bare `\p{Emoji}` property, which also matches plain digits/`#`/`*` — a DB
// value of "3" or "#" should never be treated as a valid word emoji.
const EMOJI_SEQUENCE_RE =
  /^[\p{Extended_Pictographic}\u{200D}\u{FE0E}\u{FE0F}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}]+$/u;

/** True for a non-empty string made entirely of real emoji codepoints (see EMOJI_SEQUENCE_RE). */
export function isValidEmoji(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && EMOJI_SEQUENCE_RE.test(trimmed);
}

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

  if (!isValidEmoji(emoji)) {
    return { kind: "placeholder", glyph: "", placeholderColor, placeholderLetter };
  }
  return { kind: "emoji", glyph: emoji, placeholderColor, placeholderLetter };
}
