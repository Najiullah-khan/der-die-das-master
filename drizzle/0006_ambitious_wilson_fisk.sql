CREATE INDEX `idx_account_user` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_completed` ON `game_sessions` (`completed_at`);--> statement-breakpoint
CREATE INDEX `idx_leaderboard_rank_alltime` ON `leaderboard` (`rank_alltime`);--> statement-breakpoint
CREATE INDEX `idx_session_user` ON `session` (`user_id`);