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

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  // Unindexed FK (production audit finding): every sign-out-all-devices, session list, and the
  // cascade lookup on user delete filters by userId — was a full table scan without this.
  (t) => [index("idx_session_user").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
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
  },
  // Same unindexed-FK gap as `session.userId` above — looked up every sign-in to find linked
  // OAuth accounts for a user, and on the user-delete cascade.
  (t) => [index("idx_account_user").on(t.userId)],
);

// Better Auth's own rate limiter (blueprint §10: rate limiting on /api/auth/*). Storage is set
// to "database" in auth/config.ts — the default "memory" backend doesn't work correctly across
// Cloudflare Workers' stateless edge invocations, the same reason lib/security/rate-limit.ts
// (our custom limiter for the non-auth routes) is DB-backed rather than in-memory too.
export const rateLimit = sqliteTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: integer("last_request").notNull(), // raw epoch ms, not a Date — better-auth does its own arithmetic on this
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
    // Which 10-word batch this session was for (batch progression upgrade). Nullable/defaulted
    // for backward compatibility with rows written before this column existed.
    batch: integer("batch").notNull().default(1),
    // Set only when this session is a placement challenge — the locked level it will unlock
    // on a pass (>= 80% first-try accuracy, checked in the /complete route).
    placementForLevel: text("placement_for_level", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }),
    score: integer("score").notNull().default(0),
    perfectBatch: integer("perfect_batch", { mode: "boolean" }).notNull().default(false),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("idx_sessions_user").on(t.userId, t.completedAt),
    // The weekly leaderboard (lib/db/queries/leaderboard.ts computeWeeklyRanked) filters on
    // completedAt >= <start of week> across *all* users, not one userId — idx_sessions_user
    // above doesn't help there since userId is its leading column. A single-column index on
    // completedAt serves that range scan directly (production audit finding).
    index("idx_sessions_completed").on(t.completedAt),
  ],
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
export const leaderboard = sqliteTable(
  "leaderboard",
  {
    userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    totalScore: integer("total_score").notNull().default(0),
    wordsMastered: integer("words_mastered").notNull().default(0),
    rankWeekly: integer("rank_weekly"),
    rankAlltime: integer("rank_alltime"),
  },
  // getAllTimeLeaderboard's ORDER BY rankAlltime — the actual sort key every /leaderboard
  // (alltime) read uses, not totalScore directly (production audit finding).
  (t) => [index("idx_leaderboard_rank_alltime").on(t.rankAlltime)],
);

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

// Per-user, per-level batch progression and level-unlock state (batch progression upgrade).
// A1 is always treated as unlocked without needing a row here (enforced at the query layer) —
// a row only exists once a user has played past batch 1 and/or a level has been unlocked.
export const userProgress = sqliteTable(
  "user_progress",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    cefrLevel: text("cefr_level", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] }).notNull(),
    highestBatchReached: integer("highest_batch_reached").notNull().default(1),
    selectedBatch: integer("selected_batch").notNull().default(1),
    unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
    unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" }),
    // Stamped on every batch completion (advanceBatch) — the source of truth for "resume state"
    // (batch progression & level unlocking UI upgrade): the row with the max lastPlayedAt across
    // all of a user's levels is where the "Resume" CTA on /play sends them back to.
    lastPlayedAt: integer("last_played_at", { mode: "timestamp_ms" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cefrLevel] })],
);

// Blog posts (admin-authored, /admin CRUD; published ones rendered at /blog).
export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_posts_published").on(t.published, t.createdAt)],
);

// App-level fixed-window rate limiting (blueprint §10/§16 risk note: "rate limiting + basic
// anomaly checks" against scripted score farming), on top of — not instead of — Cloudflare's own
// edge rate limiting rules, which only a real deployment can configure. A DB-backed counter
// (rather than in-memory) is what actually works correctly across stateless edge invocations.
export const rateLimitBuckets = sqliteTable("rate_limit_buckets", {
  key: text("key").primaryKey(), // `${scope}:${identifier}:${windowStart}`
  count: integer("count").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
});

// User-submitted feedback/bug reports (feedback & suggestion system). userId nullable — guests
// can submit too, identified only by their optional self-reported email.
export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email"),
    type: text("type", { enum: ["bug", "feature", "general"] }).notNull(),
    message: text("message").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("idx_feedback_created").on(t.createdAt)],
);
