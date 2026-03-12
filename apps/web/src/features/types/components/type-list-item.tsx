import { Loader2, Check, X, Pencil, Trash2, Syringe, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@offline-sqlite/i18n";
import { getSubtleListItemTransition, subtleListItemAnimate, subtleListItemInitial } from "@/lib/animations";
import { getEntityColor } from "@/utils/entity-colors";

interface TypeListItemProps {
	item: {
		id: string;
		name: string;
	};
	index: number;
	type: "visit" | "expense";
	isEditing: boolean;
	editFormName: string;
	isEditPending: boolean;
	isDeletePending: boolean;
	onStartEdit: (id: string, name: string) => void;
	onEditFormNameChange: (name: string) => void;
	onEditSubmit: (e: React.FormEvent) => void;
	onEditCancel: () => void;
	onDelete: (id: string) => void;
}

export function TypeListItem({
	item,
	index,
	type,
	isEditing,
	editFormName,
	isEditPending,
	isDeletePending,
	onStartEdit,
	onEditFormNameChange,
	onEditSubmit,
	onEditCancel,
	onDelete,
}: TypeListItemProps) {
	const { t } = useTranslation();
	const itemColor = getEntityColor(item.id);

	if (isEditing) {
		return (
			<motion.form
				key={item.id}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				onSubmit={onEditSubmit}
				className="border-border/50 hover:border-border bg-muted/30 hover:bg-card flex items-center
					justify-between rounded-xl border p-4
					transition-[background-color,border-color,box-shadow] duration-300"
				style={{ borderLeftColor: itemColor, borderLeftWidth: "4px" }}
			>
				<Input
					value={editFormName}
					onChange={(e) => onEditFormNameChange(e.target.value)}
					autoFocus
					className="flex-1"
				/>
				<Button
					type="submit"
					size="icon"
					className="h-9 w-9 rounded-lg"
					disabled={isEditPending || !editFormName.trim()}
				>
					{isEditPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Check className="h-4 w-4" />
					)}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-9 w-9 rounded-lg"
					onClick={onEditCancel}
				>
					<X className="h-4 w-4" />
				</Button>
			</motion.form>
		);
	}

	return (
		<motion.div
			key={item.id}
			initial={subtleListItemInitial}
			animate={subtleListItemAnimate}
			transition={getSubtleListItemTransition(index, 0.1, 0.05)}
			className="group border-border/50 hover:border-border bg-muted/30 hover:bg-card flex items-center
				justify-between rounded-xl border p-4 transition-[background-color,border-color,box-shadow]
				duration-300"
			style={{ borderLeftColor: itemColor, borderLeftWidth: "4px" }}
		>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
					<span className="text-xs text-primary">
						{type == "visit" ? <Syringe className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
					</span>
				</div>
				<span className="font-medium">{item.name}</span>
			</div>
			<div className="flex gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 rounded-lg"
					onClick={() => onStartEdit(item.id, item.name)}
					aria-label={t(`${type}Types.editAria`)}
				>
					<Pencil className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => onDelete(item.id)}
					aria-label={t(`${type}Types.deleteAria`)}
					className="text-destructive hover:text-destructive h-8 w-8 rounded-lg"
					disabled={isDeletePending}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
		</motion.div>
	);
}
