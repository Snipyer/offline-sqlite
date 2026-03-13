import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useRef } from "react";
import { useTranslation } from "@offline-sqlite/i18n";
import { QRCodeSVG } from "qrcode.react";

interface CallPatientDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	patientName: string;
	patientPhone: string;
}

export function CallPatientDialog({ open, onOpenChange, patientName, patientPhone }: CallPatientDialogProps) {
	const { t } = useTranslation();
	const contentRef = useRef<HTMLDivElement | null>(null);
	const normalizedPhone = patientPhone.trim();
	const callUri = normalizedPhone.startsWith("tel:") ? normalizedPhone : `tel:${normalizedPhone}`;

	useEffect(() => {
		if (!open) {
			return;
		}

		const handlePointerDownOutside = (event: PointerEvent) => {
			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (!contentRef.current?.contains(target)) {
				onOpenChange(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDownOutside, true);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDownOutside, true);
		};
	}, [open, onOpenChange]);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent ref={contentRef} className="max-w-sm rounded-2xl border p-0 shadow-2xl">
				<div
					className="to-background rounded-t-2xl bg-linear-to-br from-zinc-100 via-zinc-50 px-6 py-6
						dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950"
				>
					<AlertDialogHeader className="gap-2">
						<AlertDialogTitle className="text-base font-semibold tracking-tight">
							{t("patients.callDialogTitle", {
								name: patientName,
								phone: patientPhone,
							})}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-muted-foreground text-xs">
							{t("patients.callDialogDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
				</div>

				<div className="flex flex-col items-center gap-4 px-6 py-6">
					<div className="bg-background rounded-xl border p-3 shadow-xs">
						<QRCodeSVG
							value={callUri}
							size={208}
							marginSize={2}
							title={t("patients.callDialogQrAlt", {
								name: patientName,
								phone: patientPhone,
							})}
						/>
					</div>
				</div>

				<AlertDialogFooter className="border-t px-6 py-4">
					<AlertDialogCancel className="w-full sm:w-auto">{t("common.cancel")}</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
