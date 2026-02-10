import { db } from "@offline-sqlite/db";
import * as schema from "@offline-sqlite/db/schema/auth";
import { env } from "@offline-sqlite/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { localization } from "better-auth-localization";

const isSecureCookie = env.BETTER_AUTH_URL.startsWith("https://");

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",

		schema: schema,
	}),
	trustedOrigins: [
		...env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
		"http://tauri.localhost",
		"https://tauri.localhost",
		"tauri://localhost",
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: isSecureCookie ? "lax" : "lax",
			secure: isSecureCookie,
			httpOnly: true,
		},
	},
	plugins: [
		localization({
			defaultLocale: "default",
			fallbackLocale: "default",
			getLocale: async (request) => {
				if (!request) {
					return "default";
				}
				const cookies = request.headers.get("offline-sqlite.locale");

				if (cookies?.startsWith("ar")) {
					return "ar-SA";
				}
				if (cookies?.startsWith("fr")) {
					return "fr-FR";
				}
				return "default";
			},
		}),
	],
});
