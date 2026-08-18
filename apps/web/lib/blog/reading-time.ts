const WORDS_PER_MINUTE = 200;

/** Rounded-up minute estimate from a markdown string's word count. */
export function estimateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
