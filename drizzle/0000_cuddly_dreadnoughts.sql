CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`published_at` integer,
	`content` text,
	`content_cn` text,
	`raw_html` text,
	`description` text,
	`author` text,
	`heat_score` real DEFAULT 0,
	`is_paywalled` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_url_unique` ON `articles` (`url`);--> statement-breakpoint
CREATE TABLE `fetch_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP,
	`completed_at` integer,
	`log` text,
	`error_count` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`weight` real DEFAULT 1,
	`is_active` integer DEFAULT true,
	`last_fetched_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `system_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`source` text,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
