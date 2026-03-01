import { Hono } from "hono";
import { ensureDatabase, getDb } from "../db";
import { activations, licenses } from "../db/schema";
import { SigningConfigError, signPayload, verifyLicenseKey } from "../crypto/sign";
import { eq, and } from "drizzle-orm";
import { activateSchema } from "../validation";
import type { AppBindings } from "../types";

const activate = new Hono<{ Bindings: AppBindings }>();

function configErrorResponse(err: unknown) {
	const referenceId = crypto.randomUUID();
	// Only log the error code — never internal details which may reveal system state.
	const logCode = err instanceof SigningConfigError ? err.code : "internal_error";
	console.error(`[activate][config][${referenceId}] ${logCode}`);

	return {
		error: `Activation service unavailable. Please contact support with reference ${referenceId}.`,
	};
}

activate.post("/", async (c) => {
	await ensureDatabase(c.env);
	const db = getDb(c.env);

	let rawBody: unknown;
	try {
		rawBody = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const parsed = activateSchema.safeParse(rawBody);
	if (!parsed.success) {
		return c.json({ error: "Invalid request body" }, 400);
	}
	const body = parsed.data;

	// 1. Verify key signature
	let payload: any;
	try {
		payload = verifyLicenseKey(body.license_key, c.env);
	} catch (err: any) {
		if (err instanceof SigningConfigError) {
			return c.json(configErrorResponse(err), 500);
		}
		// Return a generic error to avoid leaking verification details.
		return c.json({ error: "Invalid license key" }, 400);
	}

	// 2. Check license exists in DB and is not revoked
	const [license] = await db.select().from(licenses).where(eq(licenses.id, payload.id)).limit(1);

	if (!license) {
		return c.json({ error: "License not found" }, 404);
	}
	if (license.isRevoked) {
		return c.json({ error: "License has been revoked" }, 403);
	}

	// 3. Check subscription expiry
	if (license.plan === "subscription" && license.expiresAt) {
		if (new Date(license.expiresAt) < new Date()) {
			return c.json({ error: "Subscription has expired" }, 403);
		}
	}

	// 4. Check if already activated on a different machine
	const existingActivations = await db
		.select()
		.from(activations)
		.where(and(eq(activations.licenseId, payload.id), eq(activations.isActive, true)));

	const activatedOnDifferentMachine = existingActivations.some((a) => a.fingerprint !== body.fingerprint);

	if (activatedOnDifferentMachine) {
		// Count transfers
		const totalActivations = await db
			.select()
			.from(activations)
			.where(eq(activations.licenseId, payload.id));

		if (totalActivations.length >= (license.maxTransfers ?? 3)) {
			return c.json({ error: "Maximum machine transfers reached. Contact support." }, 403);
		}
		return c.json({ error: "License is already activated on another machine. Deactivate first." }, 409);
	}

	// 5. Check if already activated on this machine (idempotent)
	const existingOnThisMachine = existingActivations.find((a) => a.fingerprint === body.fingerprint);

	const activationId =
		existingOnThisMachine?.id ?? `act_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
	const activatedAt = existingOnThisMachine?.activatedAt ?? new Date().toISOString();

	if (!existingOnThisMachine) {
		// 6. Create activation record
		await db.insert(activations).values({
			id: activationId,
			licenseId: payload.id,
			fingerprint: body.fingerprint,
			fingerprintSignals: body.fingerprint_signals ? JSON.stringify(body.fingerprint_signals) : null,
			activatedAt,
			appVersion: body.app_version ?? null,
			os: body.os ?? null,
			isActive: true,
		});
	}

	// 7. Generate signed activation token
	const tokenPayload = {
		license_id: payload.id,
		fingerprint: body.fingerprint,
		plan: license.plan,
		features: payload.features ?? ["all"],
		activated_at: activatedAt,
		expires_at: license.expiresAt ?? null,
	};

	let signedToken: string;
	try {
		signedToken = signPayload(tokenPayload, c.env);
	} catch (err: any) {
		if (err instanceof SigningConfigError) {
			return c.json(configErrorResponse(err), 500);
		}
		throw err;
	}

	return c.json({
		activation_token: signedToken,
		license: {
			plan: license.plan,
			features: payload.features ?? ["all"],
			expires_at: license.expiresAt,
		},
		activated_at: activatedAt,
	});
});

export default activate;
