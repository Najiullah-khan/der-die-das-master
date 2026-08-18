"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Article, CefrLevel, Word } from "@ddd/shared";
import { createDeck, currentCard, isComplete, submitGuess, type DeckState } from "@/lib/game-engine/deck";
import { pointsForAttempt } from "@/lib/game-engine/scoring";
import { initialStreakState, updateSessionStreak, type StreakState } from "@/lib/game-engine/streaks";
import {
  recordAttempt,
  recordSessionComplete,
  recordBatchComplete,
  recordLevelUnlocked,
  loadGuestProgress,
  passedPlacementChallenge,
  hasSeenSaveProgressPrompt,
  type GuestProgress,
} from "@/lib/game-engine/storage";
import { LEVEL_ORDER, getPrerequisiteLevel, getNextLevel, isComingSoonLevel, hasComingSoonLevelsAfter } from "@/lib/game-engine/levels";
import { useSession } from "@/lib/auth/client";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { Card } from "@/components/game/Card";
import { ArticleButton } from "@/components/game/ArticleButton";
import { ProgressBar } from "@/components/game/ProgressBar";
import { ComboToast } from "@/components/game/ComboToast";
import { BatchDrawer } from "@/components/game/BatchDrawer";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import type { LevelProgress } from "@/lib/db/queries/user-progress";

// Both modals are only ever shown conditionally (locked-level challenge prompt / guest save-progress
// prompt) — most sessions never trigger either one, so splitting them out of PlayClient's own
// (already substantial) bundle means most players never pay for their code at all.
const UnlockChallengeModal = dynamic(() => import("@/components/game/UnlockChallengeModal").then((m) => m.UnlockChallengeModal), {
  ssr: false,
});
const GuestSaveProgressModal = dynamic(() => import("@/components/auth/GuestSaveProgressModal").then((m) => m.GuestSaveProgressModal), {
  ssr: false,
});

const ARTICLES: Article[] = ["der", "die", "das"];
const FEEDBACK_DELAY_MS = 600;

// Sentinel session id for offline-fallback play (blueprint §9 PWA offline support): there's no
// server session to attach to, so attempt/complete calls are skipped entirely and progress is
// recorded locally, the same as guest play.
const OFFLINE_SESSION_ID = "offline";

interface BatchInfo {
  highestBatchReached: number;
  selectedBatch: number;
}

interface FinalResult {
  score: number;
  perfectBatch: boolean;
  placementTarget: CefrLevel | null;
  placementPassed: boolean;
}

interface PlayClientProps {
  level: CefrLevel;
  /** null for guests — progress instead comes from localStorage (see loadGuestProgress). */
  initialLevelProgress: LevelProgress[] | null;
  /** Total batch count for `level`, derived server-side from its word count. */
  totalBatches: number;
  /** From the `?batch=` query param (e.g. the /play Resume CTA) — an explicit request for which
   *  batch to auto-load, still clamped below to the user's actual unlocked range. Null when the
   *  route was entered plainly (e.g. a nav link), in which case the resume point applies instead. */
  requestedBatch: number | null;
}

export function PlayClient({ level, initialLevelProgress, totalBatches, requestedBatch }: PlayClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const [guestProgress] = useState<GuestProgress | null>(() => (initialLevelProgress ? null : loadGuestProgress()));

  const [unlockedLevels, setUnlockedLevels] = useState<CefrLevel[]>(() => {
    if (initialLevelProgress) return initialLevelProgress.filter((p) => p.unlocked).map((p) => p.cefrLevel);
    if (guestProgress) return ["A1", ...guestProgress.unlockedLevels.filter((l) => l !== "A1")];
    return ["A1"];
  });
  const [batchByLevel, setBatchByLevel] = useState<Partial<Record<CefrLevel, BatchInfo>>>(() => {
    const map: Partial<Record<CefrLevel, BatchInfo>> = {};
    if (initialLevelProgress) {
      for (const p of initialLevelProgress) {
        map[p.cefrLevel] = { highestBatchReached: p.highestBatchReached, selectedBatch: p.selectedBatch };
      }
    } else if (guestProgress) {
      for (const [lvl, info] of Object.entries(guestProgress.levelProgress)) {
        map[lvl as CefrLevel] = info as BatchInfo;
      }
    }
    return map;
  });

  const prerequisite = getPrerequisiteLevel(level);
  const isLevelUnlocked = unlockedLevels.includes(level);
  const highestUnlockedLevel = [...LEVEL_ORDER].reverse().find((l) => unlockedLevels.includes(l)) ?? "A1";

  // Once "Start Challenge" is clicked, we're playing `prerequisite` (not `level`) with
  // `placementForLevel: level` — passing it unlocks `level` and redirects into it.
  const [challengeStarted, setChallengeStarted] = useState(false);
  const playingLevel = !isLevelUnlocked && challengeStarted && prerequisite ? prerequisite : level;
  const placementTarget = !isLevelUnlocked && challengeStarted && prerequisite ? level : null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState<StreakState>(initialStreakState());
  const [result, setResult] = useState<FinalResult | null>(null);
  // Declared here (not inline in the final return) — this component has several early returns
  // above the game screen, and hooks must run in the same order on every render. Targets the
  // server-authoritative final score once `result` lands, so it tweens straight through to it.
  const displayedScore = useCountUp(result?.score ?? score);
  const [error, setError] = useState<string | null>(null);
  // Lazy initializer (not a mount-effect setState call) so the very first render already shows
  // the right resume batch for the auto-start path — `batchByLevel` above has already run its
  // own initializer earlier in this same render pass by the time this one runs. An explicit
  // `?batch=` request wins if it's within the unlocked range; otherwise fall back to the stored
  // resume point.
  const [currentBatch, setCurrentBatch] = useState(() => {
    const info = batchByLevel[level];
    // Clamped against `totalBatches` (the real, server-computed word-count cap), not just
    // `highestBatchReached` — guest-side storage doesn't know the true cap, so its
    // highestBatchReached/selectedBatch can land one past the level's real last batch right
    // after finishing it (batch auto-advance fix would otherwise try to fetch a batch that
    // doesn't exist).
    const cap = Math.min(info?.highestBatchReached ?? 1, totalBatches);
    // Self-healing resume point: advanceBatch/recordBatchComplete now always write
    // selectedBatch === highestBatchReached (the *next* batch, not the just-completed one), but
    // rows written before that fix — or any other future divergence between the two — must not
    // strand a returning user back on an already-cleared batch. Taking the max of both, rather
    // than trusting selectedBatch alone, makes this correct regardless of write-path history
    // (this is the actual root cause of a "Batch 2 is active in the drawer, but the game screen
    // still loads Batch 1" mismatch).
    const resumeBatch = Math.min(Math.max(info?.selectedBatch ?? 1, info?.highestBatchReached ?? 1, 1), cap);
    if (requestedBatch !== null && requestedBatch >= 1 && requestedBatch <= cap) return requestedBatch;
    return resumeBatch;
  });
  // Local override so the save-progress modal doesn't reappear on this same result screen right
  // after being dismissed — hasSeenSaveProgressPrompt() itself only updates in localStorage,
  // which doesn't trigger a re-render on its own.
  const [saveModalDismissed, setSaveModalDismissed] = useState(false);

  const isOffline = sessionId === OFFLINE_SESSION_ID;
  const recordsLocally = isGuest || isOffline;

  // No synchronous setState before the first `await` here — this is called directly from the
  // mount effect below, and the lint rule against setState-in-effect traces into useCallback
  // functions invoked from an effect body, not just literal statements in the effect itself.
  const beginFetch = useCallback(async (batchNum: number, targetLevel: CefrLevel, placement: CefrLevel | null) => {
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: targetLevel, batch: batchNum, placementForLevel: placement ?? undefined }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data: { sessionId: string; words: Word[] } = await res.json();
      setSessionId(data.sessionId);
      setDeck(createDeck(data.words));
    } catch {
      // No network (or the server's unreachable) — fall back to the service worker's cached
      // word list so offline play still works (blueprint §1/§9).
      try {
        const params = new URLSearchParams({ level: targetLevel, batch: String(batchNum) });
        const res = await fetch(`/api/words?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load offline word list");
        const data: { words: Word[] } = await res.json();
        if (data.words.length === 0) throw new Error("Offline word list empty");
        setSessionId(OFFLINE_SESSION_ID);
        setDeck(createDeck(data.words));
      } catch {
        setError("Couldn't start a session. Please try again.");
      }
    }
  }, []);

  // Resets session state then kicks off beginFetch — used by every *interactive* trigger
  // (batch jumper, retry button, "Start Challenge"). Not used by the mount effect below: on a
  // fresh mount there's nothing to reset (all this state is already at its initial value).
  const startSession = useCallback(
    (batchNum: number, targetLevel: CefrLevel, placement: CefrLevel | null) => {
      setError(null);
      setResult(null);
      setSessionId(null);
      setDeck(null);
      setScore(0);
      setCombo(initialStreakState());
      setCurrentBatch(batchNum);
      void beginFetch(batchNum, targetLevel, placement);
    },
    [beginFetch],
  );

  // Mount-only (the parent page keys PlayClient by `level`, so a level change always means a
  // fresh instance rather than this effect re-running): auto-start if already unlocked; if
  // locked and the prerequisite is ALSO locked, skip straight to the prerequisite's own gate
  // instead of offering a challenge for a level two hops away; otherwise render the
  // UnlockChallengeModal below and wait for the user to opt in.
  useEffect(() => {
    if (isLevelUnlocked) {
      (async () => {
        await beginFetch(currentBatch, level, null);
      })();
    } else if (prerequisite && !unlockedLevels.includes(prerequisite)) {
      router.replace(`/play/${prerequisite}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyLocalProgress = useCallback(
    (passed: boolean, unlockTarget: CefrLevel | null) => {
      setBatchByLevel((prev) => {
        const existing = prev[playingLevel] ?? { highestBatchReached: 1, selectedBatch: 1 };
        const highestBatchReached = Math.max(existing.highestBatchReached, currentBatch + 1);
        return {
          ...prev,
          [playingLevel]: {
            highestBatchReached,
            // Resume point is the *next* batch, not the one just finished (batch auto-advance
            // fix) — mirrors the same fix in advanceBatch/recordBatchComplete.
            selectedBatch: highestBatchReached,
          },
        };
      });
      if (unlockTarget && passed) {
        setUnlockedLevels((prev) => (prev.includes(unlockTarget) ? prev : [...prev, unlockTarget]));
      }
    },
    [playingLevel, currentBatch],
  );

  // Coming Soon levels (level-availability upgrade) have no seeded vocabulary — checked
  // unconditionally, ahead of the unlock-gating below, so there's no path (direct URL, a stale
  // unlock, or otherwise) that reaches the placement-challenge modal or the game screen for one.
  if (isComingSoonLevel(level)) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="text-4xl" aria-hidden>
          ⏳
        </span>
        <h1 className="text-2xl font-bold">{level} · Coming Soon</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          We&apos;re still building out the {level} vocabulary. In the meantime, keep practicing up to B2!
        </p>
        <Link
          href="/play"
          className="mt-2 rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
        >
          Back to levels
        </Link>
      </main>
    );
  }

  if (!isLevelUnlocked && !challengeStarted) {
    if (!prerequisite) return null; // unreachable: A1 has no prerequisite and is always unlocked
    return (
      <UnlockChallengeModal
        lockedLevel={level}
        prerequisiteLevel={prerequisite}
        onStart={() => {
          setChallengeStarted(true);
          void startSession(1, prerequisite, level);
        }}
        onCancel={() => router.push(`/play/${highestUnlockedLevel}`)}
      />
    );
  }

  if (error) {
    return <main className="mx-auto max-w-md px-6 py-12 text-center text-red-600">{error}</main>;
  }

  if (!deck || !sessionId) {
    return <main className="mx-auto max-w-md px-6 py-12 text-center">Loading...</main>;
  }

  if (result) {
    if (result.placementTarget) {
      return (
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
          {result.placementPassed ? (
            <>
              <p className="text-3xl font-bold">Level unlocked! 🎉</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                {result.placementTarget} is now unlocked — nice work.
              </p>
              <a
                href={`/play/${result.placementTarget}`}
                className="mt-4 rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
              >
                Continue to {result.placementTarget}
              </a>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold">Not quite there yet</p>
              <p className="text-neutral-600 dark:text-neutral-300">
                You need at least 80% correct on your first try to unlock {result.placementTarget}. Give it another shot?
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void startSession(1, playingLevel, placementTarget)}
                  className="rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
                >
                  Retry Challenge
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/play/${playingLevel}`)}
                  className="rounded-full border border-neutral-300 px-6 py-3 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Back to {playingLevel}
                </button>
              </div>
            </>
          )}
        </main>
      );
    }

    const batchInfo = batchByLevel[playingLevel] ?? { highestBatchReached: 1, selectedBatch: currentBatch };

    // One-time, high-converting prompt right after a guest finishes Batch 1 of A1 (guest
    // onboarding upgrade) — takes priority over the small inline SignInPrompt shown for every
    // other guest completion.
    const isFirstA1Batch = playingLevel === "A1" && currentBatch === 1;
    const showSaveProgressModal =
      isGuest && isFirstA1Batch && !saveModalDismissed && !hasSeenSaveProgressPrompt();

    // Batch transition CTA (auto-advance upgrade): once more batches remain, the primary action
    // is moving forward, not replaying — "Play again" (same batch) becomes the secondary link.
    // Finishing the level's last batch surfaces the next level's placement challenge instead.
    const isLastBatch = currentBatch >= totalBatches;
    const nextLevel = isLastBatch ? getNextLevel(playingLevel) : null;
    const nextLevelAlreadyUnlocked = nextLevel !== null && unlockedLevels.includes(nextLevel);

    return (
      <>
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
          <p className="text-3xl font-bold">Session complete!</p>
          <p className="text-xl">Score: {displayedScore}</p>
          {result.perfectBatch && (
            <p className="font-semibold text-amber-700 dark:text-amber-400">Flawless batch bonus! 🎉</p>
          )}

          <div className="mt-4 flex flex-col items-center gap-2">
            {!isLastBatch && (
              <button
                type="button"
                onClick={() => void startSession(currentBatch + 1, playingLevel, null)}
                className="rounded-full bg-der px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-der-strong"
              >
                Next Batch →
              </button>
            )}
            {isLastBatch && nextLevel && (
              <a
                href={`/play/${nextLevel}`}
                className="rounded-full bg-linear-to-r from-der to-das px-6 py-3 font-medium text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                {nextLevelAlreadyUnlocked ? `Continue to ${nextLevel} →` : `Take Placement Challenge for ${nextLevel} →`}
              </a>
            )}
            {isLastBatch && !nextLevel && hasComingSoonLevelsAfter(playingLevel) && (
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Congratulations! You mastered all available levels up to {playingLevel}!
              </p>
            )}
            {isLastBatch && !nextLevel && !hasComingSoonLevelsAfter(playingLevel) && (
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                You&apos;ve completed every level — Grammatik-Meister! 🏆
              </p>
            )}
            <button
              type="button"
              onClick={() => void startSession(currentBatch, playingLevel, null)}
              className="text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Play again (replay Batch {currentBatch})
            </button>
          </div>

          {isGuest && !isFirstA1Batch && <SignInPrompt />}
        </main>
        <BatchDrawer
          totalBatches={totalBatches}
          highestBatchReached={batchInfo.highestBatchReached}
          selectedBatch={currentBatch}
          onSelect={(batch) => void startSession(batch, playingLevel, null)}
        />
        {showSaveProgressModal && <GuestSaveProgressModal onDismiss={() => setSaveModalDismissed(true)} />}
      </>
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

    // Signed-in-and-online players get server-tracked mastery via the /attempt call below;
    // guests and offline-fallback play only have localStorage, so that's the sole place their
    // progress lives until they sign in (and are back online) and GuestProgressSync imports it.
    if (recordsLocally) {
      recordAttempt(wordId, outcome.correct);
    }

    // Fire-and-forget: the UI already reflects the optimistic outcome; the server call just
    // persists it (and updates mastery for authed users) without blocking gameplay. Skipped
    // entirely offline — there's no server session to attach the attempt to.
    if (!isOffline) {
      fetch(`/api/session/${sessionId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, chosenArticle: article, attemptNumber: outcome.attemptNumber }),
      }).catch(() => {});
    }

    setTimeout(() => {
      setFeedback(null);
      setDeck(outcome.state);

      if (isComplete(outcome.state)) {
        // First-try accuracy for the placement pass/fail check, computed directly from the
        // completed deck (each CompletedCard records its final `attempts` count) rather than
        // tracked incrementally — avoids a stale-closure read of any running counter here.
        const finishedWords = outcome.state.completed.length;
        const finishedFirstTry = outcome.state.completed.filter((c) => c.attempts === 1).length;
        const locallyComputedPass = placementTarget ? passedPlacementChallenge(finishedFirstTry, finishedWords) : false;

        const finalizeLocally = () => {
          const final: FinalResult = {
            score,
            perfectBatch: outcome.state.totalErrors === 0,
            placementTarget,
            placementPassed: locallyComputedPass,
          };
          if (recordsLocally) {
            recordSessionComplete(final.score, new Date().toISOString().slice(0, 10));
            recordBatchComplete(playingLevel, currentBatch);
            if (placementTarget && locallyComputedPass) recordLevelUnlocked(placementTarget);
          }
          applyLocalProgress(locallyComputedPass, placementTarget);
          setResult(final);
        };

        if (isOffline) {
          finalizeLocally();
          return;
        }

        fetch(`/api/session/${sessionId}/complete`, { method: "POST" })
          .then((res) => (res.ok ? res.json() : null))
          .then(
            (
              data: {
                score: number;
                perfectBatch: boolean;
                placementResult: { level: CefrLevel; passed: boolean } | null;
              } | null,
            ) => {
              if (!data) return finalizeLocally();
              const passed = data.placementResult?.passed ?? false;
              const target = data.placementResult?.level ?? null;
              const final: FinalResult = {
                score: data.score,
                perfectBatch: data.perfectBatch,
                placementTarget: target,
                placementPassed: passed,
              };
              // Guests still use this online path (their sessions have no userId, but the
              // server persists nothing user-specific for them) — they need the same local
              // recording authed users get for free from the server.
              if (isGuest) {
                recordSessionComplete(final.score, new Date().toISOString().slice(0, 10));
                recordBatchComplete(playingLevel, currentBatch);
                if (target && passed) recordLevelUnlocked(target);
              }
              applyLocalProgress(passed, target);
              setResult(final);
            },
          )
          .catch(finalizeLocally);
      }
    }, FEEDBACK_DELAY_MS);
  }

  const activeBatchInfo = batchByLevel[playingLevel] ?? { highestBatchReached: 1, selectedBatch: currentBatch };

  return (
    <>
      <main className="relative mx-auto flex max-w-md flex-col items-center gap-6 px-6 py-12">
        <ComboToast combo={combo.currentSessionStreak} />

        <div className="flex w-full items-center justify-between text-sm text-neutral-500">
          <span>
            Level {playingLevel} · Batch {currentBatch}
            {placementTarget && <span className="ml-2 font-medium text-der">Placement challenge</span>}
          </span>
          <span>Score: {displayedScore}</span>
        </div>

        <ProgressBar completed={deck.completed.length} total={totalWords} />

        <Card word={card.word} feedback={feedback} />

        <div className="grid w-full grid-cols-3 gap-3">
          {ARTICLES.map((article) => (
            <ArticleButton key={article} article={article} onClick={handleGuess} disabled={feedback !== null} />
          ))}
        </div>
      </main>
      {/* Placement challenges are a one-off test, not part of normal batch browsing. */}
      {!placementTarget && (
        <BatchDrawer
          totalBatches={totalBatches}
          highestBatchReached={activeBatchInfo.highestBatchReached}
          selectedBatch={currentBatch}
          onSelect={(batch) => void startSession(batch, playingLevel, null)}
        />
      )}
    </>
  );
}
