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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
	const navigate = useNavigate();
	const { isPending } = authClient.useSession();
	const { t, i18n } = useTranslation();
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
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
						navigate("/daily-summary");
						toast.success(t("auth.successSignUp"));
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z
				.object({
					name: z.string().min(2, t("validation.nameMin")),
					email: z.email(t("validation.invalidEmail")),
					password: z.string().min(8, t("validation.passwordMin")),
					confirmPassword: z.string().min(8, t("validation.passwordMin")),
				})
				.refine((value) => value.password === value.confirmPassword, {
					path: ["confirmPassword"],
					message: t("validation.passwordsMustMatch"),
				}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<div
			className="from-background via-background to-primary/5 flex min-h-full items-center justify-center
				bg-linear-to-br p-4"
		>
			<div className="w-full max-w-md">
				<div className="mb-8 text-center">
					<div className="mb-4 inline-flex items-center justify-center rounded-2xl shadow-lg">
						<img src="/square_tauri_icon.png" alt="Logo" className="h-30 w-30" />
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
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showPassword ? "text" : "password"}
												placeholder="********"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												className="pr-10"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-0 right-0 h-full px-3 py-1
													hover:bg-transparent"
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
											>
												{showPassword ? (
													<EyeOff className="text-muted-foreground size-4" />
												) : (
													<Eye className="text-muted-foreground size-4" />
												)}
											</Button>
										</div>
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
							<form.Field name="confirmPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{t("auth.confirmPassword")}</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showPassword ? "text" : "password"}
												placeholder="********"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												className="pr-10"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-0 right-0 h-full px-3 py-1
													hover:bg-transparent"
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
											>
												{showPassword ? (
													<EyeOff className="text-muted-foreground size-4" />
												) : (
													<Eye className="text-muted-foreground size-4" />
												)}
											</Button>
										</div>
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
