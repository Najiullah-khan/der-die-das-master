"use client";

import { useState } from "react";
import type { Article, Word } from "@ddd/shared";
import { WordEmoji } from "@/components/word/WordEmoji";

const ARTICLES: Article[] = ["der", "die", "das"];
const ARTICLE_STYLES: Record<Article, string> = {
  der: "bg-der-strong hover:bg-der",
  die: "bg-die-strong hover:bg-die",
  das: "bg-das-strong hover:bg-das",
};

/** Purely decorative hero mini-card — no session, no API calls, just a taste of the game loop. */
export function DemoCard({ word }: { word: Word }) {
  const [picked, setPicked] = useState<Article | null>(null);
  const correct = picked === word.article;

  return (
    <div className="w-full max-w-xs rounded-3xl border border-neutral-200/80 bg-white/70 p-5 shadow-xl shadow-neutral-900/5 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/70">
      <div
        className={`flex h-36 flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
          picked === null ? "bg-neutral-100 dark:bg-neutral-800" : correct ? "bg-das/15" : "bg-die/15"
        }`}
      >
        <WordEmoji word={word} size={64} />
        <p className="text-lg font-medium text-neutral-800 dark:text-neutral-100">{word.noun}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {ARTICLES.map((article) => (
          <button
            key={article}
            type="button"
            onClick={() => setPicked(article)}
            className={`rounded-full py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 ${ARTICLE_STYLES[article]}`}
          >
            {article}
          </button>
        ))}
      </div>

      <p className="mt-3 h-5 text-center text-sm font-medium" role="status">
        {picked === null ? "Tap the right article" : correct ? "Correct! 🎉" : `Close — it's ${word.article}`}
      </p>
    </div>
  );
}
