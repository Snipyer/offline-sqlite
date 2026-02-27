/** Types mirroring the Rust licensing module. */

export type LicensePlan = "perpetual" | "subscription";

export interface LicenseStateValid {
	state: "valid";
	plan: LicensePlan;
	features: string[];
	expires_at: string | null;
}

export interface LicenseStateTrial {
	state: "trial";
	days_remaining: number;
}

export interface LicenseStateTrialExpired {
	state: "trial_expired";
}

export interface LicenseStateExpired {
	state: "expired";
}

export interface LicenseStateInvalid {
	state: "invalid";
}

export interface LicenseStateNone {
	state: "none";
}

export type LicenseState =
	| LicenseStateValid
	| LicenseStateTrial
	| LicenseStateTrialExpired
	| LicenseStateExpired
	| LicenseStateInvalid
	| LicenseStateNone;

export interface ActivationResult {
	success: boolean;
	message: string;
	license_state: LicenseState;
}

export interface TrialInfo {
	active: boolean;
	days_remaining: number;
	trial_end: string;
}
