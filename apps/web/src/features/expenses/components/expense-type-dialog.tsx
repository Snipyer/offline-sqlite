import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "@offline-sqlite/i18n";

interface ExpenseTypeDialogProps {
	isOpen: boolean;
	newTypeName: string;
	setNewTypeName: (value: string) => void;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function ExpenseTypeDialog({
	isOpen,
	newTypeName,
	setNewTypeName,
	isPending,
	onOpenChange,
	onSubmit,
}: ExpenseTypeDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("expenses.addNewType")}</DialogTitle>
					<DialogDescription>{t("expenses.addNewTypeDesc")}</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSubmit} className="space-y-4">
					<div>
						<p className="text-muted-foreground mb-3.5 flex items-center gap-1.5 text-xs">
							<Info className="h-3.5 w-3.5" />
							<span>{t("expenseTypes.multiCreateNotice")}</span>
						</p>
						<Label htmlFor="new-type-name">{t("expenseTypes.nameLabel")}</Label>
						<Input
							id="new-type-name"
							value={newTypeName}
							onChange={(e) => setNewTypeName(e.target.value)}
							placeholder={t("expenseTypes.namePlaceholder")}
							className="mt-1.5"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isPending || !newTypeName.trim()}>
							{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							{t("common.save")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
