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
	const baseUrl = adminEnv.VITE_LICENSING_ADMIN_API_URL ?? window.location.origin;
	return `${baseUrl}/api/admin`;
}

export function getLicensingAdminApiKey() {
	return adminEnv.VITE_LICENSING_ADMIN_API_KEY?.trim() || "";
}

async function adminFetch(endpoint: string, adminApiKey: string, path: string, init?: RequestInit) {
	const headers = new Headers(init?.headers);
	headers.set("content-type", "application/json");
	if (adminApiKey) {
		headers.set("x-admin-api-key", adminApiKey);
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

export async function fetchLicenses(endpoint: string, adminApiKey: string) {
	return (await adminFetch(endpoint, adminApiKey, "/licenses", {
		method: "GET",
	})) as LicenseRecord[];
}

export async function createLicense(endpoint: string, adminApiKey: string, input: CreateLicenseInput) {
	await adminFetch(endpoint, adminApiKey, "/licenses", {
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

export async function runLicenseAction(
	endpoint: string,
	adminApiKey: string,
	licenseId: string,
	action: LicenseAction,
) {
	await adminFetch(endpoint, adminApiKey, `/licenses/${licenseId}/${action}`, { method: "POST" });
}
