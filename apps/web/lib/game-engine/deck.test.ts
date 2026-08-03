import { describe, expect, it } from "vitest";
import type { Article, Word } from "@ddd/shared";
import { createDeck, currentCard, isComplete, submitGuess } from "./deck";

function makeWord(id: number, article: Article, noun: string): Word {
  return {
    id,
    noun,
    slug: `${article}-${noun.toLowerCase()}`,
    article,
    plural: `${noun}s`,
    emoji: "",
    emojiSource: "placeholder",
    translation: noun,
    cefrLevel: "A1",
    exampleDe: null,
    exampleEn: null,
    exampleSource: null,
    pronunciation: null,
    frequencyRank: null,
    source: "test",
  };
}

const HUND = makeWord(1, "der", "Hund");
const KATZE = makeWord(2, "die", "Katze");
const HAUS = makeWord(3, "das", "Haus");

describe("createDeck", () => {
  it("puts every word in the queue with zero attempts, nothing completed", () => {
    const state = createDeck([HUND, KATZE, HAUS]);
    expect(state.queue).toHaveLength(3);
    expect(state.queue.every((c) => c.attempts === 0)).toBe(true);
    expect(state.completed).toHaveLength(0);
    expect(state.totalErrors).toBe(0);
  });
});

describe("currentCard / isComplete", () => {
  it("returns the front of the queue, and null/true once empty", () => {
    let state = createDeck([HUND]);
    expect(currentCard(state)?.word.noun).toBe("Hund");
    expect(isComplete(state)).toBe(false);

    state = submitGuess(state, "der").state;
    expect(currentCard(state)).toBeNull();
    expect(isComplete(state)).toBe(true);
  });
});

describe("submitGuess — correct answer", () => {
  it("moves the card to completed with attemptNumber 1 on a first-try correct guess", () => {
    const state = createDeck([HUND, KATZE]);
    const outcome = submitGuess(state, "der");

    expect(outcome.correct).toBe(true);
    expect(outcome.attemptNumber).toBe(1);
    expect(outcome.word.noun).toBe("Hund");
    expect(outcome.state.queue.map((c) => c.word.noun)).toEqual(["Katze"]);
    expect(outcome.state.completed).toEqual([{ word: HUND, attempts: 1 }]);
    expect(outcome.state.totalErrors).toBe(0);
  });
});

describe("submitGuess — wrong answer (No Word Left Behind)", () => {
  it("re-queues the missed word instead of dropping it, and increments totalErrors", () => {
    const state = createDeck([HUND, KATZE, HAUS]);
    const outcome = submitGuess(state, "die"); // Hund is "der", so this is wrong

    expect(outcome.correct).toBe(false);
    expect(outcome.attemptNumber).toBe(1);
    expect(outcome.state.totalErrors).toBe(1);
    expect(outcome.state.completed).toHaveLength(0);

    // the missed word must still be somewhere in the queue, not lost
    const requeuedHund = outcome.state.queue.find((c) => c.word.noun === "Hund");
    expect(requeuedHund).toBeDefined();
    expect(requeuedHund?.attempts).toBe(1);
    expect(outcome.state.queue).toHaveLength(3);
  });

  it("re-inserts a few slots back rather than immediately at the front", () => {
    const words = Array.from({ length: 6 }, (_, i) => makeWord(i + 1, "der", `Wort${i + 1}`));
    const state = createDeck(words);
    const outcome = submitGuess(state, "die"); // wrong for every "der" word

    // the missed word should not be the very next card
    expect(outcome.state.queue[0].word.noun).not.toBe("Wort1");
    // but it should still be present somewhere
    expect(outcome.state.queue.some((c) => c.word.noun === "Wort1")).toBe(true);
  });

  it("re-inserts at the end when fewer cards remain than the requeue offset", () => {
    const state = createDeck([HUND, KATZE]);
    const outcome = submitGuess(state, "die"); // Hund wrong

    expect(outcome.state.queue.map((c) => c.word.noun)).toEqual(["Katze", "Hund"]);
  });

  it("tracks increasing attempt numbers across repeated misses on the same word", () => {
    let state = createDeck([HUND]);
    let outcome = submitGuess(state, "die");
    expect(outcome.attemptNumber).toBe(1);
    state = outcome.state;

    outcome = submitGuess(state, "das");
    expect(outcome.attemptNumber).toBe(2);
    state = outcome.state;

    outcome = submitGuess(state, "der"); // finally correct on 3rd try
    expect(outcome.correct).toBe(true);
    expect(outcome.attemptNumber).toBe(3);
    expect(outcome.state.completed).toEqual([{ word: HUND, attempts: 3 }]);
  });
});

describe("submitGuess — full batch completion", () => {
  it("empties the queue and moves every word to completed once all are solved", () => {
    let state = createDeck([HUND, KATZE, HAUS]);
    state = submitGuess(state, "der").state; // Hund correct
    state = submitGuess(state, "die").state; // Katze correct
    state = submitGuess(state, "das").state; // Haus correct

    expect(isComplete(state)).toBe(true);
    expect(state.completed).toHaveLength(3);
    expect(state.totalErrors).toBe(0);
  });

  it("throws if called on an already-empty deck", () => {
    let state = createDeck([HUND]);
    state = submitGuess(state, "der").state;
    expect(() => submitGuess(state, "der")).toThrow();
  });
});
