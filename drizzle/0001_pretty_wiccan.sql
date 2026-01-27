CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`heat_score` real DEFAULT 0,
	`first_seen_at` integer,
	`last_updated_at` integer,
	`status` text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_system_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`source` text,
	`metadata` text,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_system_logs`("id", "level", "message", "source", "metadata", "created_at") SELECT "id", "level", "message", "source", "metadata", "created_at" FROM `system_logs`;--> statement-breakpoint
DROP TABLE `system_logs`;--> statement-breakpoint
ALTER TABLE `__new_system_logs` RENAME TO `system_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `articles` ADD `event_id` text REFERENCES events(id);--> statement-breakpoint
ALTER TABLE `articles` ADD `match_confidence` real;--> statement-breakpoint
ALTER TABLE `articles` ADD `match_status` text;