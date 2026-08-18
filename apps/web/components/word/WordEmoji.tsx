import type { Article } from "@ddd/shared";
import { isValidEmoji } from "@/lib/emoji/resolve";

const FALLBACK_ICON_SRC = "/images/fallback-icon.jpg";

interface WordEmojiProps {
  word: { noun: string; article: Article; emoji: string | null };
  /** Pixel size, applied identically to the emoji glyph and the fallback image — this (not
   * matching Tailwind text-size and h-/w- classes by hand) is what actually guarantees zero
   * layout shift when a card swaps between the two. */
  size: number;
  className?: string;
}

/**
 * Renders a word's real Unicode emoji when it has one, or the branded der/die/das fallback icon
 * otherwise — used everywhere a vocabulary card shows a word's glyph (flashcard, Codex list,
 * word detail page, homepage demo card). Validity is checked with `isValidEmoji`, not a plain
 * truthiness check, so DB junk in `emoji` can never render as a broken/mystery glyph.
 */
export function WordEmoji({ word, size, className }: WordEmojiProps) {
  const valid = isValidEmoji(word.emoji);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {valid ? (
        <span style={{ fontSize: size * 0.78, lineHeight: 1 }}>{word.emoji}</span>
      ) : (
        // Plain <img>, not next/image: this is a small, fully-trusted static SVG (not
        // user-generated), so next/image's raster optimization pipeline buys nothing here and
        // would need `images.dangerouslyAllowSVG` enabled globally just for this one asset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={FALLBACK_ICON_SRC}
          alt="der die das icon"
          width={size}
          height={size}
          className="h-full w-full rounded-[22%] object-contain"
        />
      )}
    </span>
  );
}
