CREATE TABLE `article_people` (
	`article_id` text NOT NULL,
	`person_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`article_id`, `person_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `article_people_article_idx` ON `article_people` (`article_id`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ja` text,
	`name_kana` text,
	`name_en` text,
	`role` text,
	`party` text,
	`image_url` text,
	`description` text,
	`wikipedia_id` text,
	`last_synced_at` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `title_cn` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `tags` text;