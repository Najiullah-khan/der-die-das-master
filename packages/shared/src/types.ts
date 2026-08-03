export type Article = "der" | "die" | "das";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Mastery =
  | "Never Seen"
  | "Struggled"
  | "Learning"
  | "Mastered"
  | "Perfect";

export interface EmojiAssignment {
  emoji: string;
  /** How the emoji was chosen — lets the UI decide whether to also render a placeholder. */
  source: "curated" | "category" | "placeholder";
}

/** A single noun as it exists in the final, validated dataset (`nouns.json`) and the `Words` table. */
export interface Word {
  /** DB primary key. Absent on the raw pipeline dataset (`nouns.json`), present once seeded/queried from `Words`. */
  id?: number;
  noun: string;
  slug: string;
  article: Article;
  plural: string;
  emoji: string;
  emojiSource: EmojiAssignment["source"];
  translation: string;
  cefrLevel: CefrLevel;
  exampleDe: string | null;
  exampleEn: string | null;
  exampleSource: "kaikki" | "tatoeba" | null;
  pronunciation: string | null;
  frequencyRank: number | null;
  source: string;
}

export interface Session {
  id: string;
  userId: string | null;
  cefrLevel: CefrLevel;
  wordCount: number;
  score: number;
  perfectBatch: boolean;
  startedAt: number;
  completedAt: number | null;
}

export interface SessionAttempt {
  sessionId: string;
  wordId: number;
  attemptNumber: number;
  chosenArticle: Article;
  correct: boolean;
  pointsAwarded: number;
  answeredAt: number;
}

export interface WordStats {
  attempts: number;
  correct: number;
  mastery: Mastery;
}
