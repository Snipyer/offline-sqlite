import { z } from "zod";

import type { GeneratedLicensePayload } from "./types";

export const createLicenseSchema = z.object({
	id: z.string().trim().min(1, "License ID is required"),
	email: z.email("A valid email is required"),
	plan: z.enum(["perpetual", "subscription"]),
	key_payload: z.string().trim().min(1, "License key payload is required"),
	expires_at: z.string(),
	max_transfers: z.number().int().min(1, "Max transfers must be at least 1"),
	generated_output: z.string(),
});

export function extractLicenseFromGeneratorOutput(rawOutput: string): {
	payload: GeneratedLicensePayload;
	licenseKey: string;
} {
	const payloadBlockMatch = rawOutput.match(/Payload:\s*([\s\S]*?)\s*License Key:/i);
	if (!payloadBlockMatch?.[1]) {
		throw new Error("Invalid pasted generator output");
	}

	let payload: GeneratedLicensePayload;
	try {
		payload = JSON.parse(payloadBlockMatch[1].trim()) as GeneratedLicensePayload;
	} catch {
		throw new Error("Invalid payload JSON in generator output");
	}

	const licenseKeyMatch = rawOutput.match(/License Key:\s*(LKEY-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i);
	if (!licenseKeyMatch?.[1]) {
		throw new Error("Invalid license key in generator output");
	}

	return {
		payload,
		licenseKey: licenseKeyMatch[1],
	};
}

export function getValidationErrorMessage(error: unknown) {
	if (typeof error === "string") {
		return error;
	}
	if (error instanceof Error) {
		return error.message;
	}
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof (error as { message: unknown }).message === "string"
	) {
		return (error as { message: string }).message;
	}
	return "Invalid value";
}
