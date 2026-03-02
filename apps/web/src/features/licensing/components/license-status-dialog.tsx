import { useTranslation } from "@offline-sqlite/i18n";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLicense } from "../hooks/use-license";
import { LicenseServerStatusChip } from "./license-server-status-chip";
import { Button } from "@/components/ui/button";
import { ShieldQuestion } from "lucide-react";

function getStatusLabel(
	state: ReturnType<typeof useLicense>["licenseState"]["state"],
	t: (key: string) => string,
) {
	switch (state) {
		case "valid":
			return t("licensing.statusValid");
		case "trial":
			return t("licensing.statusTrial");
		case "trial_expired":
			return t("licensing.statusTrialExpired");
		case "expired":
			return t("licensing.statusExpired");
		case "invalid":
			return t("licensing.statusInvalid");
		case "none":
			return t("licensing.statusNone");
	}
}

export function LicenseStatusDialog() {
	const { t } = useTranslation();
	const { licenseState, loading, deactivateLicense, deactivateTrial } = useLicense();

	const rowClassName = "flex items-start justify-between gap-4";
	const labelClassName = "text-muted-foreground min-w-0";
	const valueClassName = "min-w-0 break-words text-right font-medium";

	const renderDetails = () => {
		if (loading) {
			return <div className="text-muted-foreground text-sm">{t("common.loading")}</div>;
		}

		if (licenseState.state === "valid") {
			return (
				<div className="space-y-2 text-sm">
					<div className={rowClassName}>
						<span className={labelClassName}>{t("licensing.statusLabel")}</span>
						<span className={valueClassName}>{getStatusLabel(licenseState.state, t)}</span>
					</div>
					<div className={rowClassName}>
						<span className={labelClassName}>{t("licensing.planLabel")}</span>
						<span className={valueClassName}>
							{licenseState.plan === "perpetual"
								? t("licensing.planPerpetual")
								: t("licensing.planSubscription")}
						</span>
					</div>
					<div className={rowClassName}>
						<span className={labelClassName}>{t("licensing.expiresAtLabel")}</span>
						<span className={valueClassName}>
							{licenseState.expires_at
								? new Date(licenseState.expires_at).toLocaleDateString()
								: t("licensing.neverExpires")}
						</span>
					</div>
				</div>
			);
		}

		if (licenseState.state === "trial") {
			return (
				<div className="space-y-2 text-sm">
					<div className={rowClassName}>
						<span className={labelClassName}>{t("licensing.statusLabel")}</span>
						<span className={valueClassName}>{getStatusLabel(licenseState.state, t)}</span>
					</div>
					<div className={rowClassName}>
						<span className={labelClassName}>{t("licensing.daysRemainingLabel")}</span>
						<span className={valueClassName}>
							{t("licensing.daysRemaining", { days: licenseState.days_remaining })}
						</span>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-2 text-sm">
				<div className={rowClassName}>
					<span className={labelClassName}>{t("licensing.statusLabel")}</span>
					<span className={valueClassName}>{getStatusLabel(licenseState.state, t)}</span>
				</div>
			</div>
		);
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="titlebar-button"
					aria-label={t("licensing.statusDialogOpenAria")}
				>
					<ShieldQuestion size={16} />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<div className="mb-4 flex justify-center">
					<LicenseServerStatusChip />
				</div>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("licensing.statusDialogTitle")}</AlertDialogTitle>
					<AlertDialogDescription className="wrap-break-word">
						{t("licensing.statusDialogDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{renderDetails()}
				<AlertDialogFooter className="items-stretch sm:flex-col sm:items-stretch sm:justify-start">
					<div className="flex w-full flex-col gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => void deactivateLicense()}
							className="whitespace-normal"
						>
							{t("licensing.debugDeactivateLicense")}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => void deactivateTrial()}
							className="whitespace-normal"
						>
							{t("licensing.debugDeactivateTrial")}
						</Button>
					</div>
					<AlertDialogCancel className="w-full sm:w-full">{t("common.cancel")}</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
