CREATE TABLE `user_progress` (
	`user_id` text NOT NULL,
	`cefr_level` text NOT NULL,
	`highest_batch_reached` integer DEFAULT 1 NOT NULL,
	`selected_batch` integer DEFAULT 1 NOT NULL,
	`unlocked` integer DEFAULT false NOT NULL,
	`unlocked_at` integer,
	PRIMARY KEY(`user_id`, `cefr_level`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `batch` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `game_sessions` ADD `placement_for_level` text;