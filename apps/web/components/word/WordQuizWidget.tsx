"use client";

import { useState } from "react";
import type { Article } from "@ddd/shared";

const ARTICLES: Article[] = ["der", "die", "das"];

const IDLE_CLASS: Record<Article, string> = {
  der: "bg-der/15 text-der-strong hover:bg-der/25 dark:text-der",
  die: "bg-die/15 text-die-strong hover:bg-die/25 dark:text-die",
  das: "bg-das/15 text-das-strong hover:bg-das/25 dark:text-das",
};
const CORRECT_CLASS = "bg-emerald-500 text-white";
const WRONG_CLASS = "bg-red-500 text-white";

/**
 * 1-click micro-quiz directly on a word page — visitors can test themselves on *this* word
 * before scrolling to related words or a full practice batch. Clicking again after a wrong
 * answer just re-picks (no separate reset control needed).
 */
export function WordQuizWidget({ article, noun }: { article: Article; noun: string }) {
  const [picked, setPicked] = useState<Article | null>(null);
  const isCorrect = picked !== null && picked === article;

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Quick check — der, die, or das {noun}?</p>
      <div role="group" aria-label={`Guess the article for ${noun}`} className="mt-3 grid grid-cols-3 gap-2">
        {ARTICLES.map((option) => {
          const isPicked = picked === option;
          const revealCorrect = picked !== null && option === article;
          const revealWrong = isPicked && option !== article;
          const stateClass = revealCorrect ? CORRECT_CLASS : revealWrong ? WRONG_CLASS : IDLE_CLASS[option];

          return (
            <button
              key={option}
              type="button"
              onClick={() => setPicked(option)}
              aria-pressed={isPicked}
              className={`rounded-full py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <p className="mt-3 h-5 text-sm font-medium" role="status">
        {picked === null ? "" : isCorrect ? "Correct! 🎉" : `Not quite — it's ${article} ${noun}.`}
      </p>
    </div>
  );
}
