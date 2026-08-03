"use client";

import type { Word } from "@ddd/shared";
import { resolveEmoji } from "@/lib/emoji/resolve";

export function Card({ word, feedback }: { word: Word; feedback: "correct" | "incorrect" | null }) {
  const resolved = resolveEmoji(word.noun, word.article, word.emoji);

  return (
    <div
      className={`flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl text-7xl transition-colors ${
        feedback === "correct"
          ? "bg-green-100 dark:bg-green-900/40"
          : feedback === "incorrect"
            ? "bg-red-100 dark:bg-red-900/40 animate-shake"
            : "bg-neutral-100 dark:bg-neutral-900"
      }`}
    >
      {resolved.kind === "emoji" ? (
        <span aria-hidden>{resolved.glyph}</span>
      ) : (
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold text-white"
          style={{ backgroundColor: resolved.placeholderColor }}
          aria-hidden
        >
          {resolved.placeholderLetter}
        </span>
      )}
      <p className="text-2xl font-medium text-neutral-800 dark:text-neutral-100">{word.noun}</p>
    </div>
  );
}
