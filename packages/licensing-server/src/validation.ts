import { z } from "zod";

/** Re-usable schema for validating admin route `:id` path parameters. */
export const adminLicenseIdParam = z.string().min(1).max(128);

export const activateSchema = z.object({
	license_key: z.string().min(1).max(4096),
	fingerprint: z.string().min(1).max(512),
	fingerprint_signals: z.array(z.string().max(256)).max(32).optional(),
	app_version: z.string().max(128).optional(),
	os: z.string().max(128).optional(),
});

export const deactivateSchema = z.object({
	license_id: z.string().min(1).max(128),
	fingerprint: z.string().min(1).max(512),
});

export const validateSchema = z.object({
	license_id: z.string().min(1).max(128),
	fingerprint: z.string().min(1).max(512),
});

export const createLicenseAdminSchema = z.object({
	id: z.string().min(1).max(128),
	email: z.email().max(320),
	plan: z.enum(["perpetual", "subscription"]),
	key_payload: z.string().min(1).max(8192),
	created_at: z.string().min(1).max(64),
	expires_at: z.string().max(64).nullable().optional(),
	max_transfers: z.number().int().min(1).max(100).optional(),
});
