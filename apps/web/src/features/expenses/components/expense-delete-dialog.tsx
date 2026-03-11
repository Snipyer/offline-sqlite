import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@offline-sqlite/i18n";

interface ExpenseDeleteDialogProps {
	deleteId: string | null;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function ExpenseDeleteDialog({
	deleteId,
	isPending,
	onOpenChange,
	onConfirm,
}: ExpenseDeleteDialogProps) {
	const { t } = useTranslation();

	return (
		<AlertDialog open={!!deleteId} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("expenses.confirmDeleteTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("expenses.confirmDelete")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={onConfirm}>
						{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						{t("common.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
