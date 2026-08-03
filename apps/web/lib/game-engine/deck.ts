import type { Article, Word } from "@ddd/shared";

/** A word still in the active queue, with how many guesses have been made on it so far. */
export interface DeckCard {
  word: Word;
  attempts: number;
}

/** A word that's been solved, recording the attempt number it was finally solved on (1 = first try). */
export interface CompletedCard {
  word: Word;
  attempts: number;
}

export interface DeckState {
  queue: DeckCard[];
  completed: CompletedCard[];
  /** Total wrong guesses across the whole batch, independent of per-word attempt counts. */
  totalErrors: number;
}

export interface GuessOutcome {
  state: DeckState;
  correct: boolean;
  /** Which attempt (1st, 2nd, 3rd+) this guess was, for the word just guessed. */
  attemptNumber: number;
  word: Word;
}

/** How far back into the queue a missed word gets re-inserted ("No Word Left Behind"). */
const REQUEUE_OFFSET = 4;

export function createDeck(words: Word[]): DeckState {
  return {
    queue: words.map((word) => ({ word, attempts: 0 })),
    completed: [],
    totalErrors: 0,
  };
}

export function currentCard(state: DeckState): DeckCard | null {
  return state.queue[0] ?? null;
}

export function isComplete(state: DeckState): boolean {
  return state.queue.length === 0;
}

/**
 * Submits a guess for the current (front-of-queue) card. Returns the resulting state
 * plus outcome info — never mutates the input state.
 *
 * Correct: the card is moved to `completed`.
 * Incorrect: the card is re-queued `REQUEUE_OFFSET` slots back (or at the end, if the
 * remaining queue is shorter than that), so the word must be solved again before the
 * batch can finish — "No Word Left Behind".
 */
export function submitGuess(state: DeckState, article: Article): GuessOutcome {
  const [card, ...rest] = state.queue;
  if (!card) {
    throw new Error("submitGuess called on an empty deck");
  }

  const attemptNumber = card.attempts + 1;
  const correct = article === card.word.article;

  if (correct) {
    return {
      state: {
        queue: rest,
        completed: [...state.completed, { word: card.word, attempts: attemptNumber }],
        totalErrors: state.totalErrors,
      },
      correct: true,
      attemptNumber,
      word: card.word,
    };
  }

  const requeued: DeckCard = { word: card.word, attempts: attemptNumber };
  const insertAt = Math.min(REQUEUE_OFFSET, rest.length);
  const newQueue = [...rest.slice(0, insertAt), requeued, ...rest.slice(insertAt)];

  return {
    state: {
      queue: newQueue,
      completed: state.completed,
      totalErrors: state.totalErrors + 1,
    },
    correct: false,
    attemptNumber,
    word: card.word,
  };
}
