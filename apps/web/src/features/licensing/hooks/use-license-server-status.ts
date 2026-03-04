import { env } from "@offline-sqlite/env/web";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type ServerStatus = "online" | "offline" | "checking";

export function useLicenseServerStatus() {
	const [status, setStatus] = useState<ServerStatus>("checking");

	useEffect(() => {
		const checkServer = async () => {
			const serverUrl = env.VITE_LICENSE_SERVER_URL;

			if (!serverUrl) {
				setStatus("offline");
				return;
			}

			try {
				const isOnline = await invoke<boolean>("check_license_server_health", {
					licenseServerUrl: serverUrl,
				});
				setStatus(isOnline ? "online" : "offline");
			} catch {
				setStatus("offline");
			}
		};

		checkServer();
		const interval = setInterval(checkServer, 30000);
		return () => clearInterval(interval);
	}, []);

	return status;
}
