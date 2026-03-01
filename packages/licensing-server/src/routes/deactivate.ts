import { Hono } from "hono";
import { ensureDatabase, getDb } from "../db";
import { activations } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { deactivateSchema } from "../validation";
import type { AppBindings } from "../types";

const deactivate = new Hono<{ Bindings: AppBindings }>();

deactivate.post("/", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);

	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = deactivateSchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json({ error: "Invalid request body" }, 400);
	}
	const body = parsed.data;

	// Find the active activation for this license + fingerprint
	const [existing] = await db
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

	if (!existing) {
		return c.json({ error: "No active activation found for this license and machine" }, 404);
	}

	// Mark as deactivated
	await db
		.update(activations)
		.set({
			isActive: false,
			deactivatedAt: new Date().toISOString(),
		})
		.where(eq(activations.id, existing.id));

	return c.json({ success: true, message: "License deactivated successfully" });
});

export default deactivate;
