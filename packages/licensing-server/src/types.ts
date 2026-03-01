export type AppBindings = {
	LICENSE_DB: D1Database;
	LICENSE_PRIVATE_KEY_B64: string;
	/** Ed25519 public key for signature verification. Required on all workers to avoid loading the private key for verification. */
	LICENSE_PUBLIC_KEY_B64: string;
	/** API key fallback for local development — must NOT be set in production. */
	ADMIN_DEV_API_KEY?: string;
	CORS_ORIGIN?: string;
	/** Set to "production" in deployed environments to disable dev-only fallbacks. */
	ENVIRONMENT?: string;
};
