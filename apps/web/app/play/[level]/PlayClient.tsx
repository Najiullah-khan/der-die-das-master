"use client";

import { useEffect, useState } from "react";
import type { Article, CefrLevel, Word } from "@ddd/shared";

const ARTICLES: Article[] = ["der", "die", "das"];

export function PlayClient({ level }: { level: CefrLevel }) {
  const [deck, setDeck] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    fetch(`/api/words?level=${level}&count=15`)
      .then((res) => res.json())
      .then((data) => setDeck(data.words));
  }, [level]);

  if (!deck) {
    return <main className="mx-auto max-w-md px-6 py-12 text-center">Loading...</main>;
  }

  if (deck.length === 0) {
    return (
      <main className="mx-auto max-w-md px-6 py-12 text-center">
        No words available for level {level} yet.
      </main>
    );
  }

  const word = deck[index];
  const done = index >= deck.length;

  function handleGuess(article: Article) {
    const correct = article === word.article;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setScore((s) => s + 10);
    setTimeout(() => {
      setFeedback(null);
      setIndex((i) => i + 1);
    }, 600);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-8 px-6 py-12">
      <div className="flex w-full items-center justify-between text-sm text-neutral-500">
        <span>Level {level}</span>
        <span>Score: {score}</span>
      </div>

      {done ? (
        <div className="text-center">
          <p className="text-2xl font-bold">Session complete!</p>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">Score: {score}</p>
        </div>
      ) : (
        <>
          <div
            className={`flex h-48 w-full items-center justify-center rounded-2xl text-7xl transition-colors ${
              feedback === "correct"
                ? "bg-green-100 dark:bg-green-900/40"
                : feedback === "incorrect"
                  ? "bg-red-100 dark:bg-red-900/40"
                  : "bg-neutral-100 dark:bg-neutral-900"
            }`}
          >
            {word.emoji || word.noun}
          </div>

          <p className="text-xl font-medium">{word.noun}</p>

          <div className="grid w-full grid-cols-3 gap-3">
            {ARTICLES.map((article) => (
              <button
                key={article}
                onClick={() => handleGuess(article)}
                disabled={feedback !== null}
                className="rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {article}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
