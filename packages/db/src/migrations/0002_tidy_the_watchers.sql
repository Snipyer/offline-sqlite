CREATE TABLE `appointment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`scheduled_time` integer NOT NULL,
	`duration` integer DEFAULT 30 NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`visit_id` text,
	`visit_type_id` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`visit_id`) REFERENCES `visit`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`visit_type_id`) REFERENCES `visit_type`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `appointment_userId_idx` ON `appointment` (`user_id`);--> statement-breakpoint
CREATE INDEX `appointment_patientId_idx` ON `appointment` (`patient_id`);--> statement-breakpoint
CREATE INDEX `appointment_scheduledTime_idx` ON `appointment` (`scheduled_time`);