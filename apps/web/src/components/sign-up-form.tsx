import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@offline-sqlite/i18n";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
	const navigate = useNavigate();
	const { isPending } = authClient.useSession();
	const { t, i18n } = useTranslation();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					fetchOptions: {
						headers: {
							"x-locale": i18n.resolvedLanguage ?? i18n.language,
						},
					},
					onSuccess: () => {
						navigate("/dashboard");
						toast.success(t("auth.successSignUp"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, t("validation.nameMin")),
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
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<line x1="19" x2="19" y1="8" y2="14" />
							<line x1="22" x2="16" y1="11" y2="11" />
						</svg>
					</div>
					<h1 className="mb-2 text-2xl font-bold">{t("auth.createAccount")}</h1>
					<p className="text-muted-foreground">{t("auth.signUpSubtitle")}</p>
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
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{t("auth.name")}</Label>
										<Input
											id={field.name}
											name={field.name}
											placeholder="John Doe"
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
										<Label htmlFor={field.name}>{t("auth.password")}</Label>
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
									{state.isSubmitting ? t("auth.submitting") : t("auth.signUp")}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</div>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					{t("auth.haveAccount")}{" "}
					<Button variant="link" onClick={onSwitchToSignIn} className="text-primary h-auto p-0">
						{t("auth.signIn")}
					</Button>
				</p>
			</div>
		</div>
	);
}
