import { motion } from "motion/react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { Currency } from "@/components/currency";
import { PaginationControls } from "@/components/pagination-controls";
import { useTranslation } from "@offline-sqlite/i18n";
import { getEntityColor } from "@/utils/entity-colors";
import { getSubtleListItemTransition, subtleListItemAnimate, subtleListItemInitial } from "@/lib/animations";

export interface ExpenseItem {
	id: string;
	expenseTypeId: string;
	expenseTypeName: string;
	quantity: number;
	unitPrice: number;
	amount: number;
	notes: string | null;
	expenseDate: Date;
	createdAt: Date;
}

interface ExpenseListProps {
	expenses: ExpenseItem[];
	isLoading: boolean;
	page: number;
	totalPages: number;
	deleteMutationPending: boolean;
	onPageChange: (page: number) => void;
	onEdit: (expense: ExpenseItem) => void;
	onDelete: (id: string) => void;
}

export function ExpenseList({
	expenses,
	isLoading,
	page,
	totalPages,
	deleteMutationPending,
	onPageChange,
	onEdit,
	onDelete,
}: ExpenseListProps) {
	const { t } = useTranslation();

	if (isLoading) {
		return <Loader className="h-32 pt-0" spinnerClassName="h-8 w-8" />;
	}

	if (expenses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="bg-muted/50 mb-4 flex h-20 w-20 items-center justify-center rounded-3xl">
					<Receipt className="text-muted-foreground/50 h-10 w-10" />
				</div>
				<p className="text-muted-foreground text-sm">{t("expenses.empty")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				{expenses.map((exp, index) => (
					<motion.div
						key={exp.id}
						initial={subtleListItemInitial}
						animate={subtleListItemAnimate}
						transition={getSubtleListItemTransition(index, 0.1, 0.05)}
						className="group border-border/50 hover:border-border bg-muted/30 hover:bg-card flex
							items-center justify-between rounded-xl border border-l-4 p-4
							transition-[background-color,border-color,box-shadow] duration-300"
						style={{
							borderLeftColor: getEntityColor(exp.expenseTypeId),
							borderLeftStyle: "solid",
						}}
					>
						<div className="flex items-center gap-4">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-lg
									bg-rose-500/10"
							>
								<Receipt className="h-5 w-5 text-rose-500" />
							</div>
							<div>
								<p className="font-medium">{exp.expenseTypeName}</p>
								<p className="text-muted-foreground text-xs">
									{new Date(exp.expenseDate).toLocaleDateString() +
										`${exp.notes ? ` • ${exp.notes}` : ""}`}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span className="font-semibold">
								<Currency value={exp.amount} />
							</span>
							<div className="flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-lg"
									onClick={() => onEdit(exp)}
									aria-label={t("expenses.editAria")}
								>
									<Pencil className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => onDelete(exp.id)}
									aria-label={t("expenses.deleteAria")}
									className="text-destructive hover:text-destructive h-8 w-8 rounded-lg"
									disabled={deleteMutationPending}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</motion.div>
				))}
			</div>
			<PaginationControls
				page={page}
				totalPages={totalPages}
				onPageChange={onPageChange}
				scrollTarget="expenses-list-top"
			/>
		</div>
	);
}
