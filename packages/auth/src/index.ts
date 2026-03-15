import { db } from "@offline-sqlite/db";
import * as schema from "@offline-sqlite/db/schema/auth";
import { env } from "@offline-sqlite/env/server";
import { tauri } from "@daveyplate/better-auth-tauri/plugin";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { localization } from "better-auth-localization";
import { Resend } from "resend";

const isSecureCookie = env.BETTER_AUTH_URL.startsWith("https://");
const authBaseURL = env.BETTER_AUTH_URL.replace(/\/+$/, "");

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
// For Tauri desktop apps, we need SameSite="none" for cross-origin between
// tauri://localhost and the local sidecar server origin to work properly
const isTauri = process.env.TAURI_ENVIRONMENT === "true";

const socialProviders = {
	...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
		? {
				google: {
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET,
					redirectURI: `${authBaseURL}/api/auth/callback/google`,
				},
			}
		: {}),
	...(env.DROPBOX_CLIENT_ID && env.DROPBOX_CLIENT_SECRET
		? {
				dropbox: {
					clientId: env.DROPBOX_CLIENT_ID,
					clientSecret: env.DROPBOX_CLIENT_SECRET,
					// redirectURI: `${authBaseURL}/api/auth/callback/dropbox`,
				},
			}
		: {}),
};

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "sqlite",

		schema: schema,
	}),
	account: {
		updateAccountOnSignIn: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "dropbox", "email-password"],
			allowDifferentEmails: false,
		},
	},
	trustedOrigins: [
		...env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
		"http://tauri.localhost",
		"https://tauri.localhost",
		"tauri://localhost",
		"offline-sqlite://cloud-backup",
		"offline-sqlite://localhost",
	],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders,
	advanced: {
		defaultCookieAttributes: {
			// Use "none" for Tauri to allow cross-origin cookies between tauri:// and http://127.0.0.1
			sameSite: isTauri ? "none" : isSecureCookie ? "lax" : "lax",
			secure: isSecureCookie,
			httpOnly: true,
		},
	},
	plugins: [
		tauri({
			scheme: "offline-sqlite",
			// Generates callbackURL=offline-sqlite://localhost in OAuth redirect_uri.
			callbackURL: "/localhost",
		}),
		emailOTP({
			otpLength: 6,
			expiresIn: 600, // 10 minutes
			async sendVerificationOTP({ email, otp, type }) {
				if (resend) {
					const subject =
						type === "forget-password" ? "Reset your password" : "Your verification code";
					try {
						await resend.emails.send({
							from: "Acme <onboarding@resend.dev>",
							to: [email],
							subject,
							text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
						});
						console.log(`[OTP Sent] email=${email}`);
					} catch (err) {
						console.error(`[OTP Error] Failed to send email via Resend:`, err);
					}
				} else {
					// Fallback to console if no API key is configured
					console.log(
						`[OTP Log] NO RESEND_API_KEY CONFIGURED. type=${type} email=${email} code=${otp}`,
					);
				}
			},
		}),
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
