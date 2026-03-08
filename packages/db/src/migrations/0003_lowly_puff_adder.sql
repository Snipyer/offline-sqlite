PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_patient` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sex` text NOT NULL,
	`age` integer,
	`date_of_birth` integer,
	`phone` text,
	`address` text,
	`medical_notes` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_patient`("id", "name", "sex", "age", "date_of_birth", "phone", "address", "medical_notes", "user_id", "created_at", "updated_at") SELECT "id", "name", "sex", "age", "date_of_birth", "phone", "address", "medical_notes", "user_id", "created_at", "updated_at" FROM `patient`;--> statement-breakpoint
DROP TABLE `patient`;--> statement-breakpoint
ALTER TABLE `__new_patient` RENAME TO `patient`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `patient_userId_idx` ON `patient` (`user_id`);--> statement-breakpoint
CREATE INDEX `patient_name_idx` ON `patient` (`name`);--> statement-breakpoint
ALTER TABLE `visit_act` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `visit` DROP COLUMN `notes`;