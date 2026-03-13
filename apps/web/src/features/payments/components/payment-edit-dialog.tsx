import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2, Check, X } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "@offline-sqlite/i18n";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toFormErrorMessages } from "@/lib/form-error-messages";

interface PaymentData {
	id: string;
	visitId: string;
	amount: number;
	paymentMethod: "cash";
	notes: string | null;
	recordedAt: string | Date;
}

interface PaymentEditDialogProps {
	isOpen: boolean;
	payment: PaymentData | null;
	remainingBalance: number;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: {
		id: string;
		amount: number;
		paymentMethod: "cash";
		notes: string | undefined;
		recordedAt: number;
	}) => void;
}

export function PaymentEditDialog({
	isOpen,
	payment,
	remainingBalance,
	isPending,
	onOpenChange,
	onSubmit,
}: PaymentEditDialogProps) {
	const { t } = useTranslation();

	const paymentSchema = z.object({
		amount: z
			.number()
			.int(t("payments.validation.amountInteger"))
			.min(1, t("payments.validation.amountMin"))
			.max(
				Math.max(1, remainingBalance),
				t("payments.validation.amountMax", { max: remainingBalance }),
			),
		paymentMethod: z.literal("cash"),
		notes: z.string(),
		recordedAt: z.string().min(1, t("payments.validation.recordedAtRequired")),
	});

	type PaymentFormValues = z.infer<typeof paymentSchema>;

	const form = useForm({
		defaultValues: {
			amount: 0,
			paymentMethod: "cash" as const,
			notes: "",
			recordedAt: "",
		} satisfies PaymentFormValues,
		validators: {
			onSubmit: paymentSchema,
		},
		onSubmit: async ({ value }) => {
			if (!payment) return;

			onSubmit({
				id: payment.id,
				amount: value.amount,
				paymentMethod: value.paymentMethod,
				notes: value.notes || undefined,
				recordedAt: new Date(value.recordedAt).getTime(),
			});
		},
	});

	useEffect(() => {
		if (!payment) return;

		const recordedAtDate =
			typeof payment.recordedAt === "string" ? new Date(payment.recordedAt) : payment.recordedAt;

		form.setFieldValue("amount", payment.amount);
		form.setFieldValue("paymentMethod", payment.paymentMethod);
		form.setFieldValue("notes", payment.notes ?? "");
		form.setFieldValue("recordedAt", toLocalDatetimeInputValue(recordedAtDate));
	}, [payment, form]);

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md rounded-2xl p-0">
				<div className="p-6">
					<AlertDialogHeader className="mb-6">
						<AlertDialogTitle>{t("payments.editPayment")}</AlertDialogTitle>
					</AlertDialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field name="amount">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="payment-edit-amount">{t("payments.amount")}</Label>
									<Input
										id="payment-edit-amount"
										type="number"
										min={1}
										value={field.state.value || ""}
										onChange={(e) =>
											field.handleChange(
												e.target.value ? parseInt(e.target.value, 10) : 0,
											)
										}
									/>
									{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
										<p key={`${error}-${index}`} className="text-destructive text-xs">
											{error}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="recordedAt">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="payment-edit-recorded-at">{t("payments.date")}</Label>
									<Input
										id="payment-edit-recorded-at"
										type="datetime-local"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
										<p key={`${error}-${index}`} className="text-destructive text-xs">
											{error}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="notes">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="payment-edit-notes">{t("payments.notes")}</Label>
									<Input
										id="payment-edit-notes"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("payments.notesPlaceholder")}
									/>
								</div>
							)}
						</form.Field>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isPending}
							>
								<X className="mr-2 h-4 w-4" />
								{t("common.cancel")}
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Check className="mr-2 h-4 w-4" />
								)}
								{t("common.save")}
							</Button>
						</div>
					</form>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function toLocalDatetimeInputValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}
