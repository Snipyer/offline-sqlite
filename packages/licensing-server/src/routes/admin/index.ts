import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAdminAccess } from "../../auth/access";
import { ensureDatabase, getDb } from "../../db";
import { activations, licenses } from "../../db/schema";
import type { AppBindings } from "../../types";

const admin = new Hono<{ Bindings: AppBindings }>();

admin.use("/*", requireAdminAccess);

admin.post("/licenses", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);

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

admin.get("/licenses", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);
	const result = await db.select().from(licenses);
	return c.json(result);
});

admin.get("/licenses/:id", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);
	const id = c.req.param("id");
	const [license] = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
	if (!license) return c.json({ error: "Not found" }, 404);

	const acts = await db.select().from(activations).where(eq(activations.licenseId, id));
	return c.json({ license, activations: acts });
});

admin.post("/licenses/:id/revoke", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);
	const id = c.req.param("id");

	await db.update(licenses).set({ isRevoked: true }).where(eq(licenses.id, id));
	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	return c.json({ success: true });
});

admin.post("/licenses/:id/reset", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);
	const id = c.req.param("id");

	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	return c.json({ success: true, message: "All activations reset" });
});

export default admin;
