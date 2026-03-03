import { useForm } from "@tanstack/react-form";
import { useTranslation } from "@offline-sqlite/i18n";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { useLicense } from "../hooks/use-license";
import { LicenseServerStatusChip } from "./license-server-status-chip";

/**
 * Full-screen activation / trial screen shown when no valid license is found.
 */
export default function ActivationScreen() {
	const { t } = useTranslation();
	const { licenseState, loading, activateLicense, startTrial } = useLicense();

	const form = useForm({
		defaultValues: { licenseKey: "" },
		onSubmit: async ({ value }) => {
			try {
				const result = await activateLicense(value.licenseKey);
				if (result.success) {
					toast.success(t("licensing.activationSuccess"));
					// The app will re-render via licenseState change and show the main UI
				} else {
					toast.error(result.message);
				}
			} catch (err: unknown) {
				toast.error(String(err));
			}
		},
		validators: {
			onSubmit: z.object({
				licenseKey: z.string().min(1, t("licensing.keyRequired")),
			}),
		},
	});

	const handleStartTrial = async () => {
		try {
			const info = await startTrial();
			toast.success(t("licensing.trialStarted", { days: info.days_remaining }));
		} catch (err: unknown) {
			toast.error(String(err));
		}
	};

	if (loading) {
		return <Loader />;
	}

	// If license is valid or trial is active the parent component will not render
	// this screen, but guard just in case.
	if (licenseState.state === "valid" || licenseState.state === "trial") {
		return null;
	}

	const isExpired = licenseState.state === "expired" || licenseState.state === "trial_expired";

	return (
		<div
			className="from-background via-background to-primary/5 flex min-h-full items-center justify-center
				bg-linear-to-br p-4"
		>
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="mb-8 text-center">
					<div
						className="bg-primary shadow-primary/25 mb-4 inline-flex size-14 items-center
							justify-center rounded-2xl shadow-lg"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="text-primary-foreground size-7"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
					</div>
					<h1 className="mb-2 text-2xl font-bold">
						{isExpired ? t("licensing.expiredTitle") : t("licensing.activateTitle")}
					</h1>
					<p className="text-muted-foreground">
						{isExpired ? t("licensing.expiredSubtitle") : t("licensing.activateSubtitle")}
					</p>
				</div>

				{/* Activation form */}
				<div className="bg-card/50 relative rounded-2xl border p-6 shadow-xl backdrop-blur-sm">
					<div className="mb-2 flex justify-center">
						<LicenseServerStatusChip />
					</div>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field name="licenseKey">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>{t("licensing.licenseKey")}</Label>
									<Input
										id={field.name}
										name={field.name}
										type="text"
										placeholder="LKEY-..."
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className="font-mono text-sm"
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-destructive text-xs">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className="w-full"
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? t("licensing.activating") : t("licensing.activate")}
								</Button>
							)}
						</form.Subscribe>
					</form>

					{/* Trial button — only show when no license ever existed */}
					{!isExpired && licenseState.state === "none" && (
						<div className="mt-4">
							<div className="relative my-4">
								<div className="absolute inset-0 flex items-center">
									<span className="border-border w-full border-t" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card text-muted-foreground px-2">
										{t("licensing.or")}
									</span>
								</div>
							</div>
							<Button variant="outline" className="w-full" onClick={handleStartTrial}>
								{t("licensing.startTrial")}
							</Button>
						</div>
					)}

					{/* Purchase link for expired state */}
					{isExpired && (
						<p className="text-muted-foreground mt-4 text-center text-sm">
							<a
								href="https://yourapp.com/pricing"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline"
							>
								{t("licensing.purchaseLicense")}
							</a>
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
