import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import { requireAdminAccess } from "../../auth/access";
import { getDb } from "../../db";
import { activations, adminAuditLog, licenses } from "../../db/schema";
import { adminLicenseIdParam, createLicenseAdminSchema } from "../../validation";
import type { AppBindings } from "../../types";

type AdminContext = Context<{ Bindings: AppBindings }>;

const admin = new Hono<{ Bindings: AppBindings }>();

admin.use("/*", requireAdminAccess);

// ── Helpers ──────────────────────────────────────────

function getActor(c: AdminContext): string {
	return (
		c.req.header("x-admin-user-email") ??
		c.req.header("cf-access-authenticated-user-email") ??
		"dev-api-key"
	);
}

async function logAudit(
	env: AppBindings,
	actor: string,
	action: string,
	targetId: string | null,
	details?: Record<string, unknown>,
) {
	try {
		const db = getDb(env);
		await db.insert(adminAuditLog).values({
			id: `audit_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
			actor,
			action,
			targetId,
			details: details ? JSON.stringify(details) : null,
			performedAt: new Date().toISOString(),
		});
	} catch (err) {
		// Audit logging must never break the request — log and continue.
		console.error("[audit] Failed to write audit log:", err instanceof Error ? err.message : err);
	}
}

function parseIdParam(c: AdminContext) {
	const raw = c.req.param("id");
	const parsed = adminLicenseIdParam.safeParse(raw);
	if (!parsed.success) return null;
	return parsed.data;
}

// ── Routes ───────────────────────────────────────────

admin.post("/licenses", async (c) => {
	const db = getDb(c.env);

	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = createLicenseAdminSchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json({ error: "Invalid request body", details: parsed.error.issues }, 400);
	}
	const body = parsed.data;

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

	await logAudit(c.env, getActor(c), "create_license", body.id, { email: body.email, plan: body.plan });

	return c.json({ success: true, id: body.id }, 201);
});

admin.get("/licenses", async (c) => {
	const db = getDb(c.env);
	// Intentionally omit keyPayload from list responses to reduce exposure.
	const result = await db
		.select({
			id: licenses.id,
			email: licenses.email,
			plan: licenses.plan,
			createdAt: licenses.createdAt,
			expiresAt: licenses.expiresAt,
			maxTransfers: licenses.maxTransfers,
			isRevoked: licenses.isRevoked,
		})
		.from(licenses);
	return c.json(result);
});

admin.get("/licenses/:id", async (c) => {
	const id = parseIdParam(c);
	if (!id) return c.json({ error: "Invalid license ID" }, 400);

	const db = getDb(c.env);
	const [license] = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
	if (!license) return c.json({ error: "Not found" }, 404);

	const acts = await db.select().from(activations).where(eq(activations.licenseId, id));
	return c.json({ license, activations: acts });
});

admin.post("/licenses/:id/revoke", async (c) => {
	const id = parseIdParam(c);
	if (!id) return c.json({ error: "Invalid license ID" }, 400);

	const db = getDb(c.env);

	await db.update(licenses).set({ isRevoked: true }).where(eq(licenses.id, id));
	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	await logAudit(c.env, getActor(c), "revoke_license", id);

	return c.json({ success: true });
});

admin.post("/licenses/:id/reset", async (c) => {
	const id = parseIdParam(c);
	if (!id) return c.json({ error: "Invalid license ID" }, 400);

	const db = getDb(c.env);

	await db
		.update(activations)
		.set({ isActive: false, deactivatedAt: new Date().toISOString() })
		.where(eq(activations.licenseId, id));

	await logAudit(c.env, getActor(c), "reset_activations", id);

	return c.json({ success: true, message: "All activations reset" });
});

export default admin;
