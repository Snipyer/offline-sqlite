export type LicensePlan = "perpetual" | "subscription";

export type LicenseRecord = {
	id: string;
	email: string;
	plan: LicensePlan;
	/** Only returned on single-license detail requests, omitted from list queries. */
	keyPayload?: string;
	createdAt: string;
	expiresAt: string | null;
	isRevoked: boolean;
	maxTransfers: number | null;
};

export type GeneratedLicensePayload = {
	id?: string;
	email?: string;
	plan?: LicensePlan;
	created_at?: string;
	expires_at?: string | null;
	max_transfers?: number;
};

export type LicenseAction = "reset" | "revoke";
