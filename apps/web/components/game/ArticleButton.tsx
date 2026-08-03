"use client";

import type { Article } from "@ddd/shared";

const ARTICLE_STYLES: Record<Article, string> = {
  der: "bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600",
  die: "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600",
  das: "bg-green-600 hover:bg-green-700 focus-visible:outline-green-600",
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
      className={`rounded-full py-4 text-lg font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${ARTICLE_STYLES[article]}`}
    >
      {article}
    </button>
  );
}
