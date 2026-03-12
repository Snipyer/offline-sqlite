import { Loader2 } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";
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

interface DeleteConfirmDialogProps {
	type: "visit" | "expense";
	isOpen: boolean;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteConfirmDialog({
	type,
	isOpen,
	isPending,
	onOpenChange,
	onConfirm,
}: DeleteConfirmDialogProps) {
	const { t } = useTranslation();

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent onOverlayClick={() => onOpenChange(false)}>
				<AlertDialogHeader>
					<AlertDialogTitle>{t(`${type}Types.confirmDeleteTitle`)}</AlertDialogTitle>
					<AlertDialogDescription>{t(`${type}Types.confirmDelete`)}</AlertDialogDescription>
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
