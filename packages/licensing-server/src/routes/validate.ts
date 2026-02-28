import { Hono } from "hono";
import { ensureDatabase, getDb } from "../db";
import { activations, licenses } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { AppBindings } from "../types";

const validate = new Hono<{ Bindings: AppBindings }>();

/**
 * Optional endpoint: clients with internet access can call this to refresh
 * their local activation token (e.g. to pick up a subscription renewal).
 */
validate.post("/", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);

	const body = await c.req.json<{
		license_id: string;
		fingerprint: string;
	}>();

	const [license] = await db.select().from(licenses).where(eq(licenses.id, body.license_id)).limit(1);

	if (!license) {
		return c.json({ error: "License not found" }, 404);
	}
	if (license.isRevoked) {
		return c.json({ valid: false, reason: "revoked" });
	}
	if (license.plan === "subscription" && license.expiresAt) {
		if (new Date(license.expiresAt) < new Date()) {
			return c.json({ valid: false, reason: "expired" });
		}
	}

	const [activation] = await db
		.select()
		.from(activations)
		.where(
			and(
				eq(activations.licenseId, body.license_id),
				eq(activations.fingerprint, body.fingerprint),
				eq(activations.isActive, true),
			),
		)
		.limit(1);

	if (!activation) {
		return c.json({ valid: false, reason: "not_activated" });
	}

	return c.json({
		valid: true,
		plan: license.plan,
		expires_at: license.expiresAt,
	});
});

export default validate;
