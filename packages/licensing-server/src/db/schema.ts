import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const licenses = sqliteTable("licenses", {
	id: text("id").primaryKey(), // "lic_a1b2c3d4"
	email: text("email").notNull(),
	plan: text("plan").notNull(), // "perpetual" | "subscription"
	keyPayload: text("key_payload").notNull(), // the full signed LKEY-... string
	createdAt: text("created_at").notNull(),
	expiresAt: text("expires_at"), // null for perpetual
	maxTransfers: integer("max_transfers").default(3),
	isRevoked: integer("is_revoked", { mode: "boolean" }).default(false),
});

export const activations = sqliteTable("activations", {
	id: text("id").primaryKey(),
	licenseId: text("license_id")
		.notNull()
		.references(() => licenses.id),
	fingerprint: text("fingerprint").notNull(),
	fingerprintSignals: text("fingerprint_signals"), // JSON array of individual hashes
	activatedAt: text("activated_at").notNull(),
	deactivatedAt: text("deactivated_at"),
	appVersion: text("app_version"),
	os: text("os"),
	isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const trialRecords = sqliteTable("trial_records", {
	fingerprint: text("fingerprint").primaryKey(),
	startedAt: text("started_at").notNull(),
	expiresAt: text("expires_at").notNull(),
});
