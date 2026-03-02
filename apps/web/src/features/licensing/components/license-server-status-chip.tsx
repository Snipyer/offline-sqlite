import { useTranslation } from "@offline-sqlite/i18n";
import { useLicenseServerStatus } from "../hooks/use-license-server-status";

export function LicenseServerStatusChip() {
	const { t } = useTranslation();
	const serverStatus = useLicenseServerStatus();

	return (
		<div
			className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
				serverStatus === "online"
					? "bg-green-500/10 text-green-600 dark:text-green-400"
					: "bg-muted text-muted-foreground"
				}`}
		>
			<span
				className={`h-2 w-2 rounded-full ${
					serverStatus === "online"
						? "bg-green-500"
						: serverStatus === "checking"
							? "bg-muted-foreground/50 animate-pulse"
							: "bg-muted-foreground/50"
					}`}
			/>
			{serverStatus === "online" ? t("licensing.serverOnline") : t("licensing.serverOffline")}
		</div>
	);
}
