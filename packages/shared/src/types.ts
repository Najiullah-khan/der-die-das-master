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

/** One row in a `/api/codex` search result: the word plus the caller's own stats, if any. */
export interface CodexEntry extends Word {
  stats: WordStats | null;
}

export interface CodexSearchResponse {
  entries: CodexEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * The Codex page's mastery *filter* — distinct from the per-word `Mastery` label stored in
 * `UserWordStats` (never_seen/discovered/struggled group several raw Mastery values together;
 * see `searchWords` for the exact query semantics of each).
 */
export type CodexMasteryFilter = "never_seen" | "discovered" | "struggled" | "any";

export interface StreakSummary {
  currentDailyStreak: number;
  highestDailyStreak: number;
  currentSessionStreak: number;
  highestSessionStreak: number;
  lastPlayedDate: string | null;
}

export interface AchievementStatus {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Epoch ms, or null if not yet unlocked. */
  unlockedAt: number | null;
}

export interface AchievementsResponse {
  achievements: AchievementStatus[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  wordsMastered: number | null;
  currentDailyStreak: number;
}

export interface LeaderboardResponse {
  range: "weekly" | "alltime";
  entries: LeaderboardEntry[];
  /** The requesting user's own row (even when outside `entries`) — null for guests, or an authed user with no score this period. */
  viewer: LeaderboardEntry | null;
}

export interface DailyMissionStatus {
  label: string;
  progress: number;
  goal: number;
  complete: boolean;
}

/** A blog post, admin-authored via `/admin` CRUD, rendered publicly at `/blog` once published. */
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  category: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  published: boolean;
}

export type FeedbackType = "bug" | "feature" | "general";

/** A user- or guest-submitted feedback/bug report, viewable by admins at /admin/feedback. */
export interface Feedback {
  id: string;
  userId: string | null;
  email: string | null;
  type: FeedbackType;
  message: string;
  createdAt: number;
}
