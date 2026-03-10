import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@offline-sqlite/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Label } from "./ui/label";
import { Eye, EyeOff, X } from "lucide-react";

type Step = "email" | "otp" | "new-password";

export default function ForgotPasswordForm({ onBackToSignIn }: { onBackToSignIn: () => void }) {
	const { t } = useTranslation();
	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const emailForm = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.emailOtp.requestPasswordReset({
				email: value.email,
			});
			if (error) {
				toast.error(error.message || error.statusText);
				return;
			}
			setEmail(value.email);
			setStep("otp");
		},
		validators: {
			onSubmit: z.object({
				email: z.email(t("validation.invalidEmail")),
			}),
		},
	});

	const otpForm = useForm({
		defaultValues: { otp: "" },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.emailOtp.checkVerificationOtp({
				email,
				type: "forget-password",
				otp: value.otp,
			});
			if (error) {
				toast.error(error.message || error.statusText);
				return;
			}
			setOtp(value.otp);
			setStep("new-password");
		},
		validators: {
			onSubmit: z.object({
				otp: z.string().length(6, t("validation.invalidEmail")),
			}),
		},
	});

	const passwordForm = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.emailOtp.resetPassword({
				email,
				otp,
				password: value.password,
			});
			if (error) {
				toast.error(error.message || error.statusText);
				return;
			}
			toast.success(t("auth.passwordResetSuccess"));
			onBackToSignIn();
		},
		validators: {
			onSubmit: z
				.object({
					password: z.string().min(8, t("validation.passwordMin")),
					confirmPassword: z.string().min(8, t("validation.passwordMin")),
				})
				.refine((value) => value.password === value.confirmPassword, {
					path: ["confirmPassword"],
					message: t("validation.passwordsMustMatch"),
				}),
		},
	});

	const handleResendCode = async () => {
		const { error } = await authClient.emailOtp.requestPasswordReset({ email });
		if (error) {
			toast.error(error.message || error.statusText);
			return;
		}
		toast.success(t("auth.codeResent"));
	};

	return (
		<div
			className="from-background via-background to-primary/5 flex min-h-full items-center justify-center
				bg-linear-to-br p-4"
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
							<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
					</div>
					<h1 className="mb-2 text-2xl font-bold">{t("auth.forgotPasswordTitle")}</h1>
					<p className="text-muted-foreground">{t("auth.forgotPasswordSubtitle")}</p>
				</div>

				<div className="bg-card/50 rounded-2xl border p-6 shadow-xl backdrop-blur-sm">
					{step === "email" && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								emailForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<emailForm.Field name="email">
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
							</emailForm.Field>

							<emailForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										className="w-full"
										disabled={!state.canSubmit || state.isSubmitting}
									>
										{state.isSubmitting ? t("auth.sendingCode") : t("auth.sendCode")}
									</Button>
								)}
							</emailForm.Subscribe>
						</form>
					)}

					{step === "otp" && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								otpForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<p className="text-muted-foreground text-sm">{t("auth.enterOtp")}</p>

							<otpForm.Field name="otp">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{t("auth.otpCode")}</Label>
										<div className="flex items-center justify-center gap-2">
											<InputOTP
												maxLength={6}
												value={field.state.value}
												onChange={(value) => field.handleChange(value)}
											>
												<InputOTPGroup className="w-full justify-center">
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
											<Button
												size="icon"
												variant={"outline"}
												disabled={!field.state.value}
												onClick={() => field.setValue("")}
											>
												<X className="size-4" />
											</Button>
										</div>
										{field.state.meta.errors.map((error) => (
											<p key={error?.message} className="text-destructive text-xs">
												{error?.message}
											</p>
										))}
									</div>
								)}
							</otpForm.Field>

							<otpForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										className="w-full"
										disabled={!state.canSubmit || state.isSubmitting}
									>
										{state.isSubmitting ? t("auth.verifying") : t("auth.verifyCode")}
									</Button>
								)}
							</otpForm.Subscribe>

							<div className="text-center">
								<Button
									variant="link"
									type="button"
									onClick={handleResendCode}
									className="text-primary h-auto p-0 text-sm"
								>
									{t("auth.resendCode")}
								</Button>
							</div>
						</form>
					)}

					{step === "new-password" && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								passwordForm.handleSubmit();
							}}
							className="space-y-4"
						>
							<passwordForm.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{t("auth.newPassword")}</Label>
										<div className="relative">
											<Input
												id={field.name}
												name={field.name}
												type={showPassword ? "text" : "password"}
												placeholder="********"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											<Button
												size={"icon"}
												variant={"ghost"}
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
												className="absolute top-0 right-0 h-full px-3 py-1
													hover:bg-transparent"
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
							</passwordForm.Field>

							<passwordForm.Field name="confirmPassword">
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
											/>
											<Button
												size={"icon"}
												variant={"ghost"}
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
												className="absolute top-0 right-0 h-full px-3 py-1
													hover:bg-transparent"
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
							</passwordForm.Field>

							<passwordForm.Subscribe>
								{(state) => (
									<Button
										type="submit"
										className="w-full"
										disabled={!state.canSubmit || state.isSubmitting}
									>
										{state.isSubmitting
											? t("auth.resettingPassword")
											: t("auth.resetPassword")}
									</Button>
								)}
							</passwordForm.Subscribe>
						</form>
					)}
				</div>

				<p className="text-muted-foreground mt-6 text-center text-sm">
					<Button
						variant="link"
						onClick={() => {
							onBackToSignIn();
						}}
						className="text-primary h-auto p-0"
					>
						{t("auth.backToSignIn")}
					</Button>
				</p>
			</div>
		</div>
	);
}
