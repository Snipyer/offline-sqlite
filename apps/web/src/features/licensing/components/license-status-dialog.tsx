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

	const renderDetails = () => {
		if (loading) {
			return <div className="text-muted-foreground text-sm">{t("common.loading")}</div>;
		}

		if (licenseState.state === "valid") {
			return (
				<div className="space-y-2 text-sm">
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("licensing.statusLabel")}</span>
						<span className="font-medium">{getStatusLabel(licenseState.state, t)}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("licensing.planLabel")}</span>
						<span className="font-medium">
							{licenseState.plan === "perpetual"
								? t("licensing.planPerpetual")
								: t("licensing.planSubscription")}
						</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("licensing.expiresAtLabel")}</span>
						<span className="font-medium">
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
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("licensing.statusLabel")}</span>
						<span className="font-medium">{getStatusLabel(licenseState.state, t)}</span>
					</div>
					<div className="flex items-center justify-between gap-4">
						<span className="text-muted-foreground">{t("licensing.daysRemainingLabel")}</span>
						<span className="font-medium">
							{t("licensing.daysRemaining", { days: licenseState.days_remaining })}
						</span>
					</div>
				</div>
			);
		}

		return (
			<div className="space-y-2 text-sm">
				<div className="flex items-center justify-between gap-4">
					<span className="text-muted-foreground">{t("licensing.statusLabel")}</span>
					<span className="font-medium">{getStatusLabel(licenseState.state, t)}</span>
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
				<AlertDialogHeader>
					<AlertDialogTitle>{t("licensing.statusDialogTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("licensing.statusDialogDescription")}</AlertDialogDescription>
				</AlertDialogHeader>
				{renderDetails()}
				<AlertDialogFooter>
					<div className="mr-auto flex gap-2">
						<Button type="button" variant="outline" onClick={() => void deactivateLicense()}>
							{t("licensing.debugDeactivateLicense")}
						</Button>
						<Button type="button" variant="outline" onClick={() => void deactivateTrial()}>
							{t("licensing.debugDeactivateTrial")}
						</Button>
					</div>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
