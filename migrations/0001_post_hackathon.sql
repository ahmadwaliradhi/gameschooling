CREATE TABLE `answer_verdicts` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`verdict_id` text NOT NULL,
	`position` integer NOT NULL,
	`question` text NOT NULL,
	`reading` text NOT NULL,
	`box` text NOT NULL,
	`judges` text NOT NULL,
	`model_outcome` text NOT NULL,
	`outcome` text NOT NULL,
	`decided_by` text NOT NULL,
	`decided_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verdict_id`) REFERENCES `verdicts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `answer_verdicts_verdict` ON `answer_verdicts` (`verdict_id`);--> statement-breakpoint
CREATE TABLE `consequences` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`child_id` text NOT NULL,
	`privilege` text NOT NULL,
	`reason` text NOT NULL,
	`parent_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `consequences_child` ON `consequences` (`child_id`);--> statement-breakpoint
CREATE TABLE `digests` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`week` text NOT NULL,
	`run_id` text NOT NULL,
	`entries` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `digests_week` ON `digests` (`family_id`,`week`);--> statement-breakpoint
CREATE TABLE `family_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`week` text NOT NULL,
	`target` integer NOT NULL,
	`reward_name` text NOT NULL,
	`given_at` integer,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_goals_week` ON `family_goals` (`family_id`,`week`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`created_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invites_family` ON `invites` (`family_id`);--> statement-breakpoint
ALTER TABLE `children` ADD `stakes` integer;--> statement-breakpoint
ALTER TABLE `children` ADD `sibling_board` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `pin_hash` text;--> statement-breakpoint
ALTER TABLE `children` ADD `pin_failures` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `children` ADD `pin_paused_until` integer;--> statement-breakpoint
ALTER TABLE `families` ADD `family_goal` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `proofs` ADD `stake_bonus` integer;--> statement-breakpoint
ALTER TABLE `proofs` ADD `photo_width` integer;--> statement-breakpoint
ALTER TABLE `proofs` ADD `photo_height` integer;--> statement-breakpoint
ALTER TABLE `quests` ADD `dropped_reason` text;--> statement-breakpoint
ALTER TABLE `quests` ADD `stake_multiplier` real;