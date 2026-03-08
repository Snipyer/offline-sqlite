import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useTranslation } from "@offline-sqlite/i18n";
import { Currency } from "@/components/currency";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

interface PaymentFormProps {
	visitId: string;
	totalAmount: number;
	totalPaid: number;
	patientId?: string;
	children?: React.ReactNode;
	onSuccess?: () => void;
}

export function PaymentForm({
	visitId,
	totalAmount,
	totalPaid,
	patientId,
	children,
	onSuccess,
}: PaymentFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [amount, setAmount] = useState("");
	const [notes, setNotes] = useState("");

	const resetForm = () => {
		setAmount("");
		setNotes("");
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			resetForm();
		}
	};

	const remainingBalance = Math.max(0, totalAmount - totalPaid);
	const amountNumber = Number(amount);

	const createPayment = useMutation(
		trpc.payment.create.mutationOptions({
			onSuccess: () => {
				toast.success(t("payments.paymentRecorded"));
				queryClient.invalidateQueries({
					queryKey: trpc.patient.getByIdWithVisits.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.payment.listByVisit.queryKey({ visitId }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.patient.listWithFilters.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.visit.list.queryKey(),
				});
				if (patientId) {
					queryClient.invalidateQueries({
						queryKey: trpc.payment.listByPatient.queryKey({ patientId }),
					});
				}
				resetForm();
				setOpen(false);
				onSuccess?.();
			},
			onError: (error: { message: string }) => {
				toast.error(error.message);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (amountNumber < 1 || amountNumber > remainingBalance) return;
		createPayment.mutate({
			visitId,
			amount: amountNumber,
			notes: notes || undefined,
		});
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogTrigger>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<form onSubmit={handleSubmit}>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("payments.addPayment")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("payments.remainingBalance")}:{" "}
							<Currency className="font-bold" value={remainingBalance} />
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="amount">{t("payments.amount")}</Label>
							<Input
								id="amount"
								type="number"
								min={1}
								max={remainingBalance}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="notes">{t("payments.notes")}</Label>
							<Input
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder={t("payments.notesPlaceholder")}
							/>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel type="button">{t("common.cancel")}</AlertDialogCancel>
						<Button type="submit" disabled={createPayment.isPending}>
							{createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{t("payments.addPayment")}
						</Button>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}
