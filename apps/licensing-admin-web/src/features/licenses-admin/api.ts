import { adminEnv } from "@offline-sqlite/env/admin-web";

import type { LicenseAction, LicenseRecord, LicensePlan } from "./types";

type CreateLicenseInput = {
	id: string;
	email: string;
	plan: LicensePlan;
	key_payload: string;
	created_at: string;
	expires_at: string;
	max_transfers: number;
};

export function getLicensingAdminEndpoint() {
	if (import.meta.env.PROD) {
		return "/api/admin";
	}

	const baseUrl = adminEnv.VITE_LICENSING_ADMIN_API_URL;
	if (!baseUrl) return "/api/admin";
	return `${baseUrl}/api/admin`;
}

/** Injected by Vite `define` — only has a value in development builds. */
declare const __DEV_ADMIN_API_KEY__: string;

async function adminFetch(endpoint: string, path: string, init?: RequestInit) {
	const headers = new Headers(init?.headers);
	if (init?.body && !headers.has("content-type")) {
		headers.set("content-type", "application/json");
	}

	// In development only, send the API key header for local auth fallback.
	// __DEV_ADMIN_API_KEY__ is replaced with "" in production builds by Vite,
	// so the key can never leak into shipped bundles.
	if (import.meta.env.DEV && __DEV_ADMIN_API_KEY__) {
		headers.set("x-admin-api-key", __DEV_ADMIN_API_KEY__);
	}

	const response = await fetch(`${endpoint}${path}`, {
		credentials: "include",
		headers,
		...init,
	});
	const payload = (await response.json().catch(() => ({}))) as { error?: string };
	if (!response.ok) {
		throw new Error(payload.error || "Request failed");
	}
	return payload;
}

export async function fetchLicenses(endpoint: string) {
	return (await adminFetch(endpoint, "/licenses", {
		method: "GET",
	})) as LicenseRecord[];
}

export async function createLicense(endpoint: string, input: CreateLicenseInput) {
	await adminFetch(endpoint, "/licenses", {
		method: "POST",
		body: JSON.stringify({
			id: input.id,
			email: input.email,
			plan: input.plan,
			key_payload: input.key_payload,
			created_at: input.created_at,
			expires_at: input.expires_at || null,
			max_transfers: input.max_transfers,
		}),
	});
}

export async function runLicenseAction(endpoint: string, licenseId: string, action: LicenseAction) {
	await adminFetch(endpoint, `/licenses/${licenseId}/${action}`, { method: "POST" });
}
