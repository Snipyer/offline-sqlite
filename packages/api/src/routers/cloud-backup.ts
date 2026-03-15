import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import z from "zod";
import { db } from "@offline-sqlite/db";
import { account } from "@offline-sqlite/db/schema/auth";
import { env } from "@offline-sqlite/env/server";

import { protectedProcedure, router } from "../index";

type Provider = "google" | "dropbox";

type LinkedAccount = typeof account.$inferSelect;

const providerSchema = z.object({
	provider: z.enum(["google", "dropbox"]),
});

const providerLabelMap: Record<Provider, string> = {
	google: "Google Drive",
	dropbox: "Dropbox",
};

function nowTimestampMs() {
	return Date.now();
}

function toBackupFileName() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hour = String(now.getHours()).padStart(2, "0");
	const minute = String(now.getMinutes()).padStart(2, "0");
	const second = String(now.getSeconds()).padStart(2, "0");

	return `offline-sqlite-${year}${month}${day}-${hour}${minute}${second}.db`;
}

function toLocalDbPath() {
	return resolve(process.cwd(), env.DATABASE_URL);
}

async function getLinkedAccount(userId: string, provider: Provider) {
	const rows = await db
		.select()
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, provider)))
		.limit(1);

	const linked = rows[0];
	if (!linked) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `${providerLabelMap[provider]} account is not connected`,
		});
	}

	return linked;
}

async function updateAccountAccessToken(
	linkedAccount: LinkedAccount,
	values: { accessToken: string; accessTokenExpiresAt?: number | null },
) {
	await db
		.update(account)
		.set({
			accessToken: values.accessToken,
			accessTokenExpiresAt: values.accessTokenExpiresAt ? new Date(values.accessTokenExpiresAt) : null,
			updatedAt: new Date(),
		})
		.where(eq(account.id, linkedAccount.id));
}

async function refreshGoogleAccessToken(linkedAccount: LinkedAccount) {
	if (!linkedAccount.refreshToken) {
		return null;
	}

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		return null;
	}

	const body = new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID,
		client_secret: env.GOOGLE_CLIENT_SECRET,
		grant_type: "refresh_token",
		refresh_token: linkedAccount.refreshToken,
	});

	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body,
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};
	if (!data.access_token) {
		return null;
	}

	const accessTokenExpiresAt = data.expires_in
		? nowTimestampMs() + data.expires_in * 1000
		: (linkedAccount.accessTokenExpiresAt?.getTime() ?? null);

	await updateAccountAccessToken(linkedAccount, {
		accessToken: data.access_token,
		accessTokenExpiresAt,
	});

	return data.access_token;
}

async function refreshDropboxAccessToken(linkedAccount: LinkedAccount) {
	if (!linkedAccount.refreshToken) {
		return null;
	}

	if (!env.DROPBOX_CLIENT_ID || !env.DROPBOX_CLIENT_SECRET) {
		return null;
	}

	const body = new URLSearchParams({
		client_id: env.DROPBOX_CLIENT_ID,
		client_secret: env.DROPBOX_CLIENT_SECRET,
		grant_type: "refresh_token",
		refresh_token: linkedAccount.refreshToken,
	});

	const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body,
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as {
		access_token?: string;
		expires_in?: number;
	};
	if (!data.access_token) {
		return null;
	}

	const accessTokenExpiresAt = data.expires_in
		? nowTimestampMs() + data.expires_in * 1000
		: (linkedAccount.accessTokenExpiresAt?.getTime() ?? null);

	await updateAccountAccessToken(linkedAccount, {
		accessToken: data.access_token,
		accessTokenExpiresAt,
	});

	return data.access_token;
}

async function ensureActiveAccessToken(linkedAccount: LinkedAccount, provider: Provider) {
	const expiresAt = linkedAccount.accessTokenExpiresAt?.getTime() ?? null;
	const hasValidAccessToken =
		!!linkedAccount.accessToken && (!expiresAt || expiresAt > nowTimestampMs() + 30_000);

	if (hasValidAccessToken && linkedAccount.accessToken) {
		return linkedAccount.accessToken;
	}

	if (provider === "google") {
		const refreshed = await refreshGoogleAccessToken(linkedAccount);
		if (refreshed) {
			return refreshed;
		}
	}

	if (provider === "dropbox") {
		const refreshed = await refreshDropboxAccessToken(linkedAccount);
		if (refreshed) {
			return refreshed;
		}
	}

	throw new TRPCError({
		code: "BAD_REQUEST",
		message: `${providerLabelMap[provider]} token expired. Please reconnect your account.`,
	});
}

async function uploadToGoogleDrive(accessToken: string, fileBlob: Blob, fileName: string) {
	const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			name: fileName,
			mimeType: "application/vnd.sqlite3",
		}),
	});

	if (!createResponse.ok) {
		const errorText = await createResponse.text();
		throw new Error(`Failed to create Drive file: ${errorText}`);
	}

	const createData = (await createResponse.json()) as { id?: string };
	if (!createData.id) {
		throw new Error("Drive file id missing after create");
	}

	const uploadResponse = await fetch(
		`https://www.googleapis.com/upload/drive/v3/files/${createData.id}?uploadType=media`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"content-type": "application/octet-stream",
			},
			body: fileBlob,
		},
	);

	if (!uploadResponse.ok) {
		const errorText = await uploadResponse.text();
		throw new Error(`Failed to upload Drive content: ${errorText}`);
	}

	return {
		providerFileId: createData.id,
	};
}

async function uploadToDropbox(accessToken: string, fileBlob: Blob, fileName: string) {
	const backupPath = `/Apps/offline-sqlite/${fileName}`;
	const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"content-type": "application/octet-stream",
			"Dropbox-API-Arg": JSON.stringify({
				path: backupPath,
				mode: "overwrite",
				autorename: false,
				mute: true,
			}),
		},
		body: fileBlob,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to upload Dropbox file: ${errorText}`);
	}

	const data = (await response.json()) as { id?: string };
	return {
		providerFileId: data.id ?? null,
	};
}

export const cloudBackupRouter = router({
	status: protectedProcedure.query(async ({ ctx }) => {
		const linkedAccounts = await db
			.select({ providerId: account.providerId })
			.from(account)
			.where(
				and(
					eq(account.userId, ctx.session.user.id),
					inArray(account.providerId, ["google", "dropbox"]),
				),
			);

		const providerIds = new Set(linkedAccounts.map((row) => row.providerId));

		return {
			googleConnected: providerIds.has("google"),
			dropboxConnected: providerIds.has("dropbox"),
		};
	}),

	backupNow: protectedProcedure.input(providerSchema).mutation(async ({ ctx, input }) => {
		const linked = await getLinkedAccount(ctx.session.user.id, input.provider);
		const accessToken = await ensureActiveAccessToken(linked, input.provider);
		const fileName = toBackupFileName();
		const dbPath = toLocalDbPath();

		try {
			await access(dbPath, constants.F_OK);
		} catch {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `Database file not found at ${dbPath}`,
			});
		}

		const fileBuffer = await readFile(dbPath);
		const fileBlob = new Blob([fileBuffer], { type: "application/octet-stream" });

		try {
			const uploaded =
				input.provider === "google"
					? await uploadToGoogleDrive(accessToken, fileBlob, fileName)
					: await uploadToDropbox(accessToken, fileBlob, fileName);

			return {
				provider: input.provider,
				fileName,
				providerFileId: uploaded.providerFileId,
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Backup upload failed for ${providerLabelMap[input.provider]}`,
				cause: error,
			});
		}
	}),
});
