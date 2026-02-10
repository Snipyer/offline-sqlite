import { db } from "@offline-sqlite/db";
import * as schema from "@offline-sqlite/db/schema/auth";
import { env } from "@offline-sqlite/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const isSecureCookie = env.BETTER_AUTH_URL.startsWith("https://");

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",

		schema: schema,
	}),
	trustedOrigins: [
		env.CORS_ORIGIN,
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
	plugins: [],
});
