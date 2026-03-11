import { Loader2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { getExpenseTypeColor } from "@/features/expenses/utils/expense-type-colors";
import { Currency } from "@/components/currency";
import { useTranslation } from "@offline-sqlite/i18n";

interface ExpenseType {
	id: string;
	name: string;
}

interface ExpenseFormProps {
	isOpen: boolean;
	isEditing: boolean;
	selectedTypeId: string;
	setSelectedTypeId: (value: string) => void;
	quantity: string;
	setQuantity: (value: string) => void;
	unitPrice: string;
	setUnitPrice: (value: string) => void;
	notes: string;
	setNotes: (value: string) => void;
	expenseDate: string;
	setExpenseDate: (value: string) => void;
	expenseTypes: ExpenseType[];
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (e: React.FormEvent) => void;
	onAddNewType: () => void;
}

export function ExpenseForm({
	isOpen,
	isEditing,
	selectedTypeId,
	setSelectedTypeId,
	quantity,
	setQuantity,
	unitPrice,
	setUnitPrice,
	notes,
	setNotes,
	expenseDate,
	setExpenseDate,
	expenseTypes,
	isPending,
	onOpenChange,
	onSubmit,
	onAddNewType,
}: ExpenseFormProps) {
	const { t } = useTranslation();

	// Calculate total from quantity and unit price
	const total = (parseInt(quantity) || 0) * (parseInt(unitPrice) || 0);

	// Get selected expense type name for display
	const selectedTypeName =
		expenseTypes.find((t) => t.id === selectedTypeId)?.name || t("expenses.selectType");

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md p-2">
				<SheetHeader>
					<SheetTitle>{isEditing ? t("expenses.editExpense") : t("expenses.addNew")}</SheetTitle>
				</SheetHeader>

				<form onSubmit={onSubmit} className="flex flex-col gap-6 py-6">
					{/* Expense Type */}
					<div>
						<Label htmlFor="expense-type" className="text-sm font-medium">
							{t("expenses.typeLabel")} *
						</Label>
						<div className="mt-1.5 flex gap-2">
							<Select value={selectedTypeId} onValueChange={(v) => setSelectedTypeId(v ?? "")}>
								<SelectTrigger className="flex-1" id="expense-type">
									<SelectValue placeholder={t("expenses.selectType")}>
										{selectedTypeName}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{expenseTypes.map((type) => (
										<SelectItem
											key={type.id}
											value={type.id}
											className="border-l-4"
											style={{ borderLeftColor: getExpenseTypeColor(type.id), borderLeftStyle: "solid" }}
										>
											{type.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={onAddNewType}
								title={t("expenses.addNewType")}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Quantity and Unit Price */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="expense-quantity" className="text-sm font-medium">
								{t("expenses.quantityLabel")} *
							</Label>
							<Input
								id="expense-quantity"
								type="number"
								min="1"
								step="1"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								placeholder={t("expenses.quantityPlaceholder")}
								className="mt-1.5"
							/>
						</div>
						<div>
							<Label htmlFor="expense-unit-price" className="text-sm font-medium">
								{t("expenses.unitPriceLabel")} *
							</Label>
							<Input
								id="expense-unit-price"
								type="number"
								step="1"
								min="1"
								value={unitPrice}
								onChange={(e) => setUnitPrice(e.target.value)}
								placeholder={t("expenses.unitPricePlaceholder")}
								className="mt-1.5"
							/>
						</div>
					</div>

					{/* Total (calculated, non-editable) */}
					<div>
						<Label htmlFor="expense-total" className="text-sm font-medium">
							{t("expenses.totalLabel")}
						</Label>
						<div className="bg-muted mt-1.5 flex h-10 items-center rounded-md border px-3">
							<span className="text-sm font-semibold">
								<Currency value={total} />
							</span>
						</div>
					</div>

					{/* Date */}
					<div>
						<Label htmlFor="expense-date" className="text-sm font-medium">
							{t("expenses.dateLabel")} *
						</Label>
						<Input
							id="expense-date"
							type="date"
							value={expenseDate}
							onChange={(e) => setExpenseDate(e.target.value)}
							className="mt-1.5"
						/>
					</div>

					{/* Notes */}
					<div>
						<Label htmlFor="expense-notes" className="text-sm font-medium">
							{t("expenses.notesLabel")}
						</Label>
						<Input
							id="expense-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("expenses.notesPlaceholder")}
							className="mt-1.5"
						/>
					</div>

					<SheetFooter className="mt-auto gap-2 flex flex-row justify-end">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							<X className="mr-2 h-4 w-4" />
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={isPending || !selectedTypeId || !quantity || !unitPrice || !expenseDate}
							className="gap-2"
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Check className="h-4 w-4" />
							)}
							{t("common.save")}
						</Button>
						
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
