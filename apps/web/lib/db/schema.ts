import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Auth tables — shape driven by Better Auth's Drizzle adapter expectations
// (id/email/name/image/createdAt/updatedAt + emailVerified on `user`; the
// adapter reads/writes these table names by default: user, session, account,
// verification). `provider` and `lastLoginAt` are blueprint (§3) extensions
// layered on top via Better Auth's `additionalFields` config.
// ---------------------------------------------------------------------------

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  name: text("name"),
  image: text("image"),
  provider: text("provider"), // 'google' | 'github' | 'email'
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

// ---------------------------------------------------------------------------
// Domain tables (blueprint §3)
// ---------------------------------------------------------------------------

export const words = sqliteTable(
  "words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noun: text("noun").notNull().unique(),
    slug: text("slug").notNull().unique(),
    article: text("article", { enum: ["der", "die", "das"] }).notNull(),
    plural: text("plural").notNull(),
    emoji: text("emoji").notNull(),
    emojiSource: text("emoji_source", { enum: ["curated", "category", "placeholder"] }).notNull(),
    translation: text("translation").notNull(),
    cefrLevel: text("cefr_level", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).notNull(),
    exampleDe: text("example_de"),
    exampleEn: text("example_en"),
    exampleSource: text("example_source", { enum: ["kaikki", "tatoeba"] }),
    pronunciation: text("pronunciation"),
    frequencyRank: integer("frequency_rank"),
    source: text("source").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_words_level").on(t.cefrLevel), index("idx_words_article").on(t.article)],
);

export const wordRelations = sqliteTable(
  "word_relations",
  {
    wordId: integer("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
    relatedWordId: integer("related_word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
    relationType: text("relation_type", { enum: ["same_topic", "compound", "similar_article"] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.wordId, t.relatedWordId] })],
);

export const userWordStats = sqliteTable(
  "user_word_stats",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    wordId: integer("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }),
    lastPracticedAt: integer("last_practiced_at", { mode: "timestamp_ms" }),
    mastery: text("mastery", {
      enum: ["Never Seen", "Struggled", "Learning", "Mastered", "Perfect"],
    })
      .notNull()
      .default("Never Seen"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.wordId] }),
    index("idx_uws_user").on(t.userId),
    index("idx_uws_mastery").on(t.userId, t.mastery),
  ],
);

// Named `gameSessions` (SQL: game_sessions) rather than blueprint's literal "Sessions" to
// avoid colliding with Better Auth's own `session` (login-session) table above.
export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // nullable: guest play
    cefrLevel: text("cefr_level", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).notNull(),
    wordCount: integer("word_count").notNull(),
    score: integer("score").notNull().default(0),
    perfectBatch: integer("perfect_batch", { mode: "boolean" }).notNull().default(false),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("idx_sessions_user").on(t.userId, t.completedAt)],
);

export const sessionAttempts = sqliteTable(
  "session_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("session_id").notNull().references(() => gameSessions.id, { onDelete: "cascade" }),
    wordId: integer("word_id").notNull().references(() => words.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    chosenArticle: text("chosen_article", { enum: ["der", "die", "das"] }).notNull(),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_attempts_session").on(t.sessionId)],
);

export const streaks = sqliteTable("streaks", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  currentDailyStreak: integer("current_daily_streak").notNull().default(0),
  highestDailyStreak: integer("highest_daily_streak").notNull().default(0),
  currentSessionStreak: integer("current_session_streak").notNull().default(0),
  highestSessionStreak: integer("highest_session_streak").notNull().default(0),
  lastPlayedDate: text("last_played_date"), // YYYY-MM-DD
});

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(), // slug, e.g. 'streak_7'
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteriaJson: text("criteria_json").notNull(),
});

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

// Materialized/denormalized leaderboard, refreshed periodically (blueprint §3 risk note) —
// avoids an expensive ORDER BY SUM() on every page view.
export const leaderboard = sqliteTable("leaderboard", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  totalScore: integer("total_score").notNull().default(0),
  wordsMastered: integer("words_mastered").notNull().default(0),
  rankWeekly: integer("rank_weekly"),
  rankAlltime: integer("rank_alltime"),
});

export const settings = sqliteTable("settings", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).notNull().default(true),
  reducedMotion: integer("reduced_motion", { mode: "boolean" }).notNull().default(false),
  dailyGoal: integer("daily_goal").notNull().default(10),
  preferredLevel: text("preferred_level", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
  theme: text("theme", { enum: ["light", "dark", "system"] })
    .notNull()
    .default("system"),
});
