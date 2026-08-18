"use client";

import type { Article } from "@ddd/shared";

// -strong (the 700-equivalent OKLCH token, see globals.css) rather than the vivid -600 tokens:
// das-600 white-on-color text measures only 3.77:1 (fails WCAG AA's 4.5:1 for normal text) and
// die-600 is a hairline 4.70:1 — both of these are player-facing buttons the whole game hinges
// on, so they get a real safety margin (blueprint §16/§17: contrast on colored buttons is
// explicitly called out as critical).
const ARTICLE_STYLES: Record<Article, string> = {
  der: "bg-der-strong hover:bg-der focus-visible:outline-der-strong",
  die: "bg-die-strong hover:bg-die focus-visible:outline-die-strong",
  das: "bg-das-strong hover:bg-das focus-visible:outline-das-strong",
};

export function ArticleButton({
  article,
  onClick,
  disabled,
}: {
  article: Article;
  onClick: (article: Article) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(article)}
      disabled={disabled}
      // Color is never the only signal (blueprint §16 accessibility risk note) — the
      // article text itself is the label, readable regardless of color perception.
      className={`rounded-full py-4 text-lg font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${ARTICLE_STYLES[article]}`}
    >
      {article}
    </button>
  );
}
