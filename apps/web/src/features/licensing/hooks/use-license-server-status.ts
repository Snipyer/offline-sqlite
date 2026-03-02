import { env } from "@offline-sqlite/env/web";
import { useEffect, useState } from "react";

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
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);

				const response = await fetch(`${serverUrl}/health`, {
					method: "HEAD",
					cache: "no-cache",
					signal: controller.signal,
				});

				clearTimeout(timeoutId);
				setStatus(response.ok ? "online" : "offline");
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
