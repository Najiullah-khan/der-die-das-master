CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`criteria_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`cefr_level` text NOT NULL,
	`word_count` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`perfect_batch` integer DEFAULT false NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `game_sessions` (`user_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`words_mastered` integer DEFAULT 0 NOT NULL,
	`rank_weekly` integer,
	`rank_alltime` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `session_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`attempt_number` integer NOT NULL,
	`chosen_article` text NOT NULL,
	`correct` integer NOT NULL,
	`points_awarded` integer DEFAULT 0 NOT NULL,
	`answered_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_session` ON `session_attempts` (`session_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`sound_enabled` integer DEFAULT true NOT NULL,
	`reduced_motion` integer DEFAULT false NOT NULL,
	`daily_goal` integer DEFAULT 10 NOT NULL,
	`preferred_level` text,
	`theme` text DEFAULT 'system' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_daily_streak` integer DEFAULT 0 NOT NULL,
	`highest_daily_streak` integer DEFAULT 0 NOT NULL,
	`current_session_streak` integer DEFAULT 0 NOT NULL,
	`highest_session_streak` integer DEFAULT 0 NOT NULL,
	`last_played_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`image` text,
	`provider` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`user_id` text NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `achievement_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_word_stats` (
	`user_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`correct` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer,
	`last_practiced_at` integer,
	`mastery` text DEFAULT 'Never Seen' NOT NULL,
	PRIMARY KEY(`user_id`, `word_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_uws_user` ON `user_word_stats` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_uws_mastery` ON `user_word_stats` (`user_id`,`mastery`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `word_relations` (
	`word_id` integer NOT NULL,
	`related_word_id` integer NOT NULL,
	`relation_type` text NOT NULL,
	PRIMARY KEY(`word_id`, `related_word_id`),
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`noun` text NOT NULL,
	`slug` text NOT NULL,
	`article` text NOT NULL,
	`plural` text NOT NULL,
	`emoji` text NOT NULL,
	`emoji_source` text NOT NULL,
	`translation` text NOT NULL,
	`cefr_level` text NOT NULL,
	`example_de` text,
	`example_en` text,
	`example_source` text,
	`pronunciation` text,
	`frequency_rank` integer,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `words_noun_unique` ON `words` (`noun`);--> statement-breakpoint
CREATE UNIQUE INDEX `words_slug_unique` ON `words` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_words_level` ON `words` (`cefr_level`);--> statement-breakpoint
CREATE INDEX `idx_words_article` ON `words` (`article`);