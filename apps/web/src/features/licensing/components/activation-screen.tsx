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
import ContactInfo from "./contact-info";
import { env } from "@offline-sqlite/env/web";

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

	const isExpired = ["expired", "trial_expired", "invalid"].includes(licenseState.state);

	return (
		<div
			className="from-background via-background to-primary/5 flex h-full items-center justify-center
				bg-linear-to-br p-4"
		>
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="mb-8 text-center">
					<div className="mb-4 inline-flex items-center justify-center rounded-2xl shadow-lg">
						<img src="/square_tauri_icon.png" alt="Logo" className="h-30 w-30" />
					</div>
					<h1 className="mb-2 text-2xl font-bold">
						{isExpired
							? t("licensing.expiredTitle")
							: t("licensing.activateTitle", { appName: env.VITE_APP_NAME })}
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

					{/* Contact info to purchase a license */}
					<ContactInfo />
				</div>
			</div>
		</div>
	);
}
