import { Hono } from "hono";
import { db } from "../db";
import { activations, licenses } from "../db/schema";
import { eq } from "drizzle-orm";

const admin = new Hono();

/** Create a license record (required before activation can succeed) */
admin.post("/licenses", async (c) => {
	const body = await c.req.json<{
		id?: string;
		email?: string;
		plan?: "perpetual" | "subscription" | string;
		key_payload?: string;
		created_at?: string;
		expires_at?: string | null;
		max_transfers?: number;
	}>();

	if (!body.id || !body.email || !body.plan || !body.key_payload || !body.created_at) {
		return c.json(
			{
				error: "Missing required fields. Required: id, email, plan, key_payload, created_at",
			},
			400,
		);
	}

	const [existing] = await db.select().from(licenses).where(eq(licenses.id, body.id)).limit(1);
	if (existing) {
		return c.json({ error: "License already exists" }, 409);
	}

	await db.insert(licenses).values({
		id: body.id,
		email: body.email,
		plan: body.plan,
		keyPayload: body.key_payload,
		createdAt: body.created_at,
		expiresAt: body.expires_at ?? null,
		maxTransfers: body.max_transfers ?? 3,
	});

	return c.json({ success: true, id: body.id }, 201);
});

/** List all licenses */
admin.get("/licenses", async (c) => {
	const result = await db.select().from(licenses);
	return c.json(result);
});

/** Get license details + activations */
admin.get("/licenses/:id", async (c) => {
	const id = c.req.param("id");
	const [license] = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
	if (!license) return c.json({ error: "Not found" }, 404);

	const acts = await db.select().from(activations).where(eq(activations.licenseId, id));

	return c.json({ license, activations: acts });
});

/** Revoke a license */
admin.post("/licenses/:id/revoke", async (c) => {
	const id = c.req.param("id");
	await db.update(licenses).set({ isRevoked: true }).where(eq(licenses.id, id));

	// Also deactivate all activations
	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	return c.json({ success: true });
});

/** Manually reset activations for a license (support use-case) */
admin.post("/licenses/:id/reset", async (c) => {
	const id = c.req.param("id");
	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	return c.json({ success: true, message: "All activations reset" });
});

export default admin;
