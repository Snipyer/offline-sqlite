import { useTranslation } from "@offline-sqlite/i18n";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { useLicense } from "../hooks/use-license";

/**
 * Shown when a trial has expired and the user must enter a license key.
 */
export default function TrialExpired() {
	const { t } = useTranslation();
	const { activateLicense } = useLicense();

	const form = useForm({
		defaultValues: { licenseKey: "" },
		onSubmit: async ({ value }) => {
			try {
				const result = await activateLicense(value.licenseKey);
				if (result.success) {
					toast.success(t("licensing.activationSuccess"));
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

	return (
		<div
			className="from-background via-background to-destructive/5 flex min-h-full items-center
				justify-center bg-linear-to-br p-4"
		>
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<div
						className="bg-destructive shadow-destructive/25 mb-4 inline-flex size-14 items-center
							justify-center rounded-2xl shadow-lg"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="text-destructive-foreground size-7"
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
					</div>
					<h1 className="mb-2 text-2xl font-bold">{t("licensing.trialExpiredTitle")}</h1>
					<p className="text-muted-foreground">{t("licensing.trialExpiredSubtitle")}</p>
				</div>

				<div className="bg-card/50 rounded-2xl border p-6 shadow-xl backdrop-blur-sm">
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
				</div>
			</div>
		</div>
	);
}
