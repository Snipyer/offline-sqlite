import { useMutation } from "@tanstack/react-query";
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
import { trpc } from "@/utils/trpc";

interface DeleteVisitDialogProps {
	visitId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function DeleteVisitDialog({ visitId, open, onOpenChange, onSuccess }: DeleteVisitDialogProps) {
	const { t } = useTranslation();

	const softDeleteMutation = useMutation(
		trpc.visit.softDelete.mutationOptions({
			onSuccess: () => {
				onOpenChange(false);
				onSuccess?.();
			},
		}),
	);

	const handleConfirm = () => {
		if (visitId) {
			softDeleteMutation.mutate({ id: visitId });
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("visits.confirmDeleteTitle")}</AlertDialogTitle>
					<AlertDialogDescription>{t("visits.confirmDelete")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleConfirm}
						disabled={softDeleteMutation.isPending}
					>
						{softDeleteMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						{t("common.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
