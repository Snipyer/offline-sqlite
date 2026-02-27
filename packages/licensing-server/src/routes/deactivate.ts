import { Hono } from "hono";
import { db } from "../db";
import { activations } from "../db/schema";
import { eq, and } from "drizzle-orm";

const deactivate = new Hono();

deactivate.post("/", async (c) => {
	const body = await c.req.json<{
		license_id: string;
		fingerprint: string;
	}>();

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
