"use client";

import type { Word } from "@ddd/shared";
import { WordEmoji } from "@/components/word/WordEmoji";

export function Card({ word, feedback }: { word: Word; feedback: "correct" | "incorrect" | null }) {
  return (
    <div
      className={`flex h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl shadow-sm transition-colors ${
        feedback === "correct"
          ? "animate-correct-pop bg-das/15 dark:bg-das/25"
          : feedback === "incorrect"
            ? "animate-shake bg-die/15 dark:bg-die/25"
            : "bg-neutral-100 dark:bg-neutral-900"
      }`}
    >
      <WordEmoji word={word} size={96} />
      <p className="text-2xl font-medium text-neutral-800 dark:text-neutral-100">{word.noun}</p>

      {/* Correctness is otherwise conveyed only by background color + shake animation — neither
          reaches a screen reader, so it needs an explicit (visually hidden) announcement. */}
      <span role="status" className="sr-only">
        {feedback === "correct" ? "Correct!" : feedback === "incorrect" ? "Incorrect" : ""}
      </span>
    </div>
  );
}
