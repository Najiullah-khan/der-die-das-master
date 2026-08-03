"use client";

import { useEffect, useState } from "react";
import type { Article, CefrLevel, Word } from "@ddd/shared";
import { createDeck, currentCard, isComplete, submitGuess, type DeckState } from "@/lib/game-engine/deck";
import { pointsForAttempt } from "@/lib/game-engine/scoring";
import { initialStreakState, updateSessionStreak, type StreakState } from "@/lib/game-engine/streaks";
import { recordAttempt, recordSessionComplete } from "@/lib/game-engine/storage";
import { Card } from "@/components/game/Card";
import { ArticleButton } from "@/components/game/ArticleButton";
import { ProgressBar } from "@/components/game/ProgressBar";
import { ComboToast } from "@/components/game/ComboToast";

const ARTICLES: Article[] = ["der", "die", "das"];
const FEEDBACK_DELAY_MS = 600;

interface FinalResult {
  score: number;
  perfectBatch: boolean;
}

export function PlayClient({ level }: { level: CefrLevel }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState<StreakState>(initialStreakState());
  const [result, setResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, wordCount: 15 }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to start session");
        return res.json();
      })
      .then((data: { sessionId: string; words: Word[] }) => {
        setSessionId(data.sessionId);
        setDeck(createDeck(data.words));
      })
      .catch(() => setError("Couldn't start a session. Please try again."));
  }, [level]);

  if (error) {
    return <main className="mx-auto max-w-md px-6 py-12 text-center text-red-600">{error}</main>;
  }

  if (!deck || !sessionId) {
    return <main className="mx-auto max-w-md px-6 py-12 text-center">Loading...</main>;
  }

  if (result) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <p className="text-3xl font-bold">Session complete!</p>
        <p className="text-xl">Score: {result.score}</p>
        {result.perfectBatch && (
          <p className="font-semibold text-amber-600">Flawless batch bonus! 🎉</p>
        )}
        <a
          href={`/play/${level}`}
          className="mt-4 rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Play again
        </a>
      </main>
    );
  }

  const card = currentCard(deck);
  if (!card) {
    // Deck emptied but /complete hasn't resolved yet — brief transitional state.
    return <main className="mx-auto max-w-md px-6 py-12 text-center">Finishing up...</main>;
  }

  const totalWords = deck.queue.length + deck.completed.length;

  function handleGuess(article: Article) {
    if (feedback !== null || !deck) return;

    const outcome = submitGuess(deck, article);
    const word = outcome.word;
    const wordId = word.id as number;

    setFeedback(outcome.correct ? "correct" : "incorrect");
    setCombo((c) => updateSessionStreak(c, outcome.correct && outcome.attemptNumber === 1));
    if (outcome.correct) {
      setScore((s) => s + pointsForAttempt(outcome.attemptNumber));
    }

    recordAttempt(wordId, outcome.correct);

    // Fire-and-forget: the UI already reflects the optimistic outcome; the server call
    // just persists it (and updates mastery for authed users) without blocking gameplay.
    fetch(`/api/session/${sessionId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId, chosenArticle: article, attemptNumber: outcome.attemptNumber }),
    }).catch(() => {});

    setTimeout(() => {
      setFeedback(null);
      setDeck(outcome.state);

      if (isComplete(outcome.state)) {
        fetch(`/api/session/${sessionId}/complete`, { method: "POST" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { score: number; perfectBatch: boolean } | null) => {
            const final = data ?? { score, perfectBatch: outcome.state.totalErrors === 0 };
            recordSessionComplete(final.score, new Date().toISOString().slice(0, 10));
            setResult(final);
          })
          .catch(() => {
            setResult({ score, perfectBatch: outcome.state.totalErrors === 0 });
          });
      }
    }, FEEDBACK_DELAY_MS);
  }

  return (
    <main className="relative mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-12">
      <ComboToast combo={combo.currentSessionStreak} />

      <div className="flex w-full items-center justify-between text-sm text-neutral-500">
        <span>Level {level}</span>
        <span>Score: {score}</span>
      </div>

      <ProgressBar completed={deck.completed.length} total={totalWords} />

      <Card word={card.word} feedback={feedback} />

      <div className="grid w-full grid-cols-3 gap-3">
        {ARTICLES.map((article) => (
          <ArticleButton key={article} article={article} onClick={handleGuess} disabled={feedback !== null} />
        ))}
      </div>
    </main>
  );
}
