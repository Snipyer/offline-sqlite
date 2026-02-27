import { Hono } from "hono";
import { db } from "../db";
import { activations, licenses } from "../db/schema";
import { signPayload, verifyLicenseKey } from "../crypto/sign";
import { eq, and } from "drizzle-orm";

const activate = new Hono();

activate.post("/", async (c) => {
	const body = await c.req.json<{
		license_key: string;
		fingerprint: string;
		fingerprint_signals?: string[];
		app_version?: string;
		os?: string;
	}>();

	// 1. Verify key signature
	let payload: any;
	try {
		payload = verifyLicenseKey(body.license_key);
	} catch (err: any) {
		return c.json({ error: err.message }, 400);
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

	const signedToken = signPayload(tokenPayload);

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
