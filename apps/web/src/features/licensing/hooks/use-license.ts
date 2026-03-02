import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@/utils/is-tauri";

import type { ActivationResult, LicenseState, TrialInfo } from "../types";

/**
 * Dynamically import Tauri invoke — only resolves inside the desktop shell.
 */
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
	const { invoke } = await import("@tauri-apps/api/core");
	return invoke<T>(cmd, args);
}

/**
 * React hook that wraps the Tauri licensing commands.
 * In browser (non-Tauri) mode it immediately reports "valid" so the
 * license gate is transparent.
 */
export function useLicense() {
	const [licenseState, setLicenseState] = useState<LicenseState>({ state: "none" });
	const [loading, setLoading] = useState(true);

	// Fetch initial state on mount
	useEffect(() => {
		if (!isTauri()) {
			// In web mode, skip the license check entirely
			setLicenseState({ state: "valid", plan: "perpetual", features: ["all"], expires_at: null });
			setLoading(false);
			return;
		}

		tauriInvoke<LicenseState>("get_license_status")
			.then(setLicenseState)
			.catch((err) => {
				console.error("Failed to get license status", err);
				setLicenseState({ state: "none" });
			})
			.finally(() => setLoading(false));
	}, []);

	const activateLicense = useCallback(async (key: string): Promise<ActivationResult> => {
		const result = await tauriInvoke<ActivationResult>("activate_license", { key });
		if (result.success) {
			setLicenseState(result.license_state);
			window.location.reload();
		}
		return result;
	}, []);

	const deactivateLicense = useCallback(async () => {
		await tauriInvoke<void>("deactivate_license");
		setLicenseState({ state: "none" });
		window.location.reload();
	}, []);

	const startTrial = useCallback(async (): Promise<TrialInfo> => {
		const info = await tauriInvoke<TrialInfo>("start_trial");
		setLicenseState({ state: "trial", days_remaining: info.days_remaining });
		window.location.reload();
		return info;
	}, []);

	const getTrialStatus = useCallback(async (): Promise<TrialInfo> => {
		return tauriInvoke<TrialInfo>("get_trial_status");
	}, []);

	const deactivateTrial = useCallback(async () => {
		await tauriInvoke<void>("deactivate_trial");
		setLicenseState({ state: "none" });
		window.location.reload();
	}, []);

	return {
		licenseState,
		loading,
		activateLicense,
		deactivateLicense,
		startTrial,
		getTrialStatus,
		deactivateTrial,
	};
}
