CREATE TABLE `patient` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sex` text NOT NULL,
	`age` integer NOT NULL,
	`phone` text,
	`address` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `patient_userId_idx` ON `patient` (`user_id`);--> statement-breakpoint
CREATE INDEX `patient_name_idx` ON `patient` (`name`);--> statement-breakpoint
CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`notes` text,
	`recorded_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visit`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payment_visitId_idx` ON `payment` (`visit_id`);--> statement-breakpoint
CREATE INDEX `payment_userId_idx` ON `payment` (`user_id`);--> statement-breakpoint
CREATE INDEX `payment_recordedAt_idx` ON `payment` (`recorded_at`);--> statement-breakpoint
CREATE TABLE `visit` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`visit_time` integer NOT NULL,
	`notes` text,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visit_userId_idx` ON `visit` (`user_id`);--> statement-breakpoint
CREATE INDEX `visit_patientId_idx` ON `visit` (`patient_id`);--> statement-breakpoint
CREATE INDEX `visit_visitTime_idx` ON `visit` (`visit_time`);--> statement-breakpoint
CREATE INDEX `visit_isDeleted_idx` ON `visit` (`is_deleted`);--> statement-breakpoint
CREATE TABLE `visit_act` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`visit_type_id` text NOT NULL,
	`price` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visit`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`visit_type_id`) REFERENCES `visit_type`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visit_act_visitId_idx` ON `visit_act` (`visit_id`);--> statement-breakpoint
CREATE INDEX `visit_act_visitTypeId_idx` ON `visit_act` (`visit_type_id`);--> statement-breakpoint
CREATE TABLE `visit_act_tooth` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_act_id` text NOT NULL,
	`tooth_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`visit_act_id`) REFERENCES `visit_act`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visit_act_tooth_visitActId_idx` ON `visit_act_tooth` (`visit_act_id`);--> statement-breakpoint
CREATE INDEX `visit_act_tooth_toothId_idx` ON `visit_act_tooth` (`tooth_id`);--> statement-breakpoint
CREATE TABLE `visit_type` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visit_type_userId_idx` ON `visit_type` (`user_id`);--> statement-breakpoint
CREATE INDEX `visit_type_name_idx` ON `visit_type` (`name`);--> statement-breakpoint
DROP TABLE `todo`;