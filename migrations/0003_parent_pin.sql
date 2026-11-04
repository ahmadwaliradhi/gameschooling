ALTER TABLE `families` ADD `parent_pin_hash` text;--> statement-breakpoint
ALTER TABLE `families` ADD `parent_pin_failures` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `families` ADD `parent_pin_paused_until` integer;