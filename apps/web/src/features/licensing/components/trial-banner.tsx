import { useTranslation } from "@offline-sqlite/i18n";

interface TrialBannerProps {
	daysRemaining: number;
}

/**
 * A persistent top banner shown while the app is running in trial mode.
 */
export default function TrialBanner({ daysRemaining }: TrialBannerProps) {
	const { t } = useTranslation();

	return (
		<div
			className="bg-primary/10 text-primary border-primary/20 flex items-center justify-center gap-2
				border-b px-4 py-1.5 text-xs font-medium"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="size-3.5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
			<span>{t("licensing.trialBanner", { days: daysRemaining })}</span>
		</div>
	);
}
