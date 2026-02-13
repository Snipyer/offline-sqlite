import { useForm } from "@tanstack/react-form";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@offline-sqlite/i18n";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
	const navigate = useNavigate();
	const { isPending } = authClient.useSession();
	const { t, i18n } = useTranslation();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					fetchOptions: {
						headers: {
							"x-locale": i18n.resolvedLanguage ?? i18n.language,
						},
					},
					onSuccess: () => {
						navigate("/dashboard");
						toast.success(t("auth.successSignIn"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email(t("validation.invalidEmail")),
				password: z.string().min(8, t("validation.passwordMin")),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div
			className="from-background via-background to-primary/5 flex min-h-svh items-center justify-center
				bg-gradient-to-br p-4"
		>
			<div className="w-full max-w-md">
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
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
					</div>
					<h1 className="mb-2 text-2xl font-bold">{t("auth.welcomeBack")}</h1>
					<p className="text-muted-foreground">{t("auth.signInSubtitle")}</p>
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
						<div>
							<form.Field name="email">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{t("auth.email")}</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder="name@example.com"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.errors.map((error) => (
											<p key={error?.message} className="text-destructive text-xs">
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<div>
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label htmlFor={field.name}>{t("auth.password")}</Label>
										</div>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											placeholder="********"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.errors.map((error) => (
											<p key={error?.message} className="text-destructive text-xs">
												{error?.message}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className="w-full"
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting ? t("auth.submitting") : t("auth.signIn")}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</div>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					{t("auth.needAccount")}{" "}
					<Button variant="link" onClick={onSwitchToSignUp} className="text-primary h-auto p-0">
						{t("auth.signUp")}
					</Button>
				</p>
			</div>
		</div>
	);
}
