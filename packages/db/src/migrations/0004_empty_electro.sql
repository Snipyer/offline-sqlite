CREATE TABLE `expense` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_type_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`amount` integer NOT NULL,
	`notes` text,
	`expense_date` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`expense_type_id`) REFERENCES `expense_type`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expense_userId_idx` ON `expense` (`user_id`);--> statement-breakpoint
CREATE INDEX `expense_expenseTypeId_idx` ON `expense` (`expense_type_id`);--> statement-breakpoint
CREATE INDEX `expense_expenseDate_idx` ON `expense` (`expense_date`);--> statement-breakpoint
CREATE TABLE `expense_type` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expense_type_userId_idx` ON `expense_type` (`user_id`);--> statement-breakpoint
CREATE INDEX `expense_type_name_idx` ON `expense_type` (`name`);