import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Loader2, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { getExpenseTypeColor } from "@/features/expenses/utils/expense-type-colors";
import { Currency } from "@/components/currency";
import { useTranslation } from "@offline-sqlite/i18n";
import { toFormErrorMessages } from "@/lib/form-error-messages";
import { createExpenseSchema } from "@/features/expenses/utils/schemas";
import type z from "zod";
import { Textarea } from "@/components/ui/textarea";

interface ExpenseType {
	id: string;
	name: string;
}

interface ExpenseData {
	id: string;
	expenseTypeId: string;
	quantity: number;
	unitPrice: number;
	amount: number;
	notes: string | null;
	expenseDate: number | Date;
	expenseType?: {
		id: string;
		name: string;
	};
}

interface ExpenseFormProps {
	isOpen: boolean;
	isEditing: boolean;
	expense?: ExpenseData;
	expenseTypes: ExpenseType[];
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: {
		expenseTypeId: string;
		quantity: number;
		unitPrice: number;
		amount: number;
		notes: string | undefined;
		expenseDate: number;
	}) => void;
	onAddNewType: () => void;
}

export function ExpenseForm({
	isOpen,
	isEditing,
	expense,
	expenseTypes,
	isPending,
	onOpenChange,
	onSubmit,
	onAddNewType,
}: ExpenseFormProps) {
	const { t } = useTranslation();

	const expenseSchema = createExpenseSchema(t);
	type ExpenseFormValues = z.infer<typeof expenseSchema>;

	const form = useForm({
		defaultValues: {
			expenseTypeId: "",
			quantity: 1,
			unitPrice: 0,
			notes: "",
			expenseDate: new Date().toISOString().split("T")[0] ?? "",
		},
		onSubmit: async ({ value }) => {
			onSubmit({
				expenseTypeId: value.expenseTypeId,
				quantity: value.quantity,
				unitPrice: value.unitPrice,
				amount: value.quantity * value.unitPrice,
				notes: value.notes || undefined,
				expenseDate: new Date(value.expenseDate).getTime(),
			});
		},
		validators: {
			onSubmit: expenseSchema,
		},
	});

	useEffect(() => {
		if (isEditing && expense) {
			form.setFieldValue("expenseTypeId", expense.expenseTypeId);
			form.setFieldValue("quantity", expense.quantity);
			form.setFieldValue("unitPrice", expense.unitPrice);
			form.setFieldValue("notes", expense.notes ?? "");
			form.setFieldValue(
				"expenseDate",
				new Date(expense.expenseDate).toISOString().split("T")[0] ?? "",
			);
		} else if (!isEditing) {
			// Reset form when switching to create mode
			form.reset();
		}
	}, [isEditing, expense, form]);

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full p-2 sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{isEditing ? t("expenses.editExpense") : t("expenses.addNew")}</SheetTitle>
				</SheetHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="flex flex-col gap-6 py-6"
				>
					{/* Expense Type */}
					<div>
						<Label htmlFor="expense-type" className="text-sm font-medium">
							{t("expenses.typeLabel")} *
						</Label>
						<div className="mt-1.5 flex gap-2">
							<form.Field name="expenseTypeId">
								{(field) => {
									const selectedTypeName =
										expenseTypes.find((t) => t.id === field.state.value)?.name ||
										t("expenses.selectType");
									return (
										<div className="flex w-full flex-col">
											<Select
												value={field.state.value}
												onValueChange={(v) => field.handleChange(v ?? "")}
											>
												<SelectTrigger className="w-full flex-1" id="expense-type">
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
															style={{
																borderLeftColor: getExpenseTypeColor(type.id),
																borderLeftStyle: "solid",
															}}
														>
															{type.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											{toFormErrorMessages(field.state.meta.errors).map(
												(error, index) => (
													<p
														key={`${error}-${index}`}
														className="text-destructive mt-1.5 text-xs"
													>
														{error}
													</p>
												),
											)}
										</div>
									);
								}}
							</form.Field>
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
							<form.Field name="quantity">
								{(field) => (
									<>
										<Input
											id="expense-quantity"
											type="number"
											min={1}
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value ? parseInt(e.target.value) : 0,
												)
											}
											placeholder={t("expenses.quantityPlaceholder")}
											className="mt-1.5"
										/>
										{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
											<p
												key={`${error}-${index}`}
												className="text-destructive mt-1.5 text-xs"
											>
												{error}
											</p>
										))}
									</>
								)}
							</form.Field>
						</div>
						<div>
							<Label htmlFor="expense-unit-price" className="text-sm font-medium">
								{t("expenses.unitPriceLabel")} *
							</Label>
							<form.Field name="unitPrice">
								{(field) => (
									<>
										<Input
											id="expense-unit-price"
											type="number"
											min={1}
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value ? parseInt(e.target.value) : 0,
												)
											}
											placeholder={t("expenses.unitPricePlaceholder")}
											className="mt-1.5"
										/>
										{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
											<p
												key={`${error}-${index}`}
												className="text-destructive mt-1.5 text-xs"
											>
												{error}
											</p>
										))}
									</>
								)}
							</form.Field>
						</div>
					</div>

					{/* Total (calculated, non-editable) */}
					<div>
						<Label htmlFor="expense-total" className="text-sm font-medium">
							{t("expenses.totalLabel")}
						</Label>
						<div className="bg-muted mt-1.5 flex h-10 items-center rounded-md border px-3">
							<span className="text-sm font-semibold">
								<form.Subscribe
									selector={(state) => ({
										quantity: state.values.quantity || 0,
										unitPrice: state.values.unitPrice || 0,
									})}
									children={({ quantity, unitPrice }) => (
										<Currency value={quantity * unitPrice} />
									)}
								/>
							</span>
						</div>
					</div>

					{/* Date */}
					<div>
						<Label htmlFor="expense-date" className="text-sm font-medium">
							{t("expenses.dateLabel")} *
						</Label>
						<form.Field name="expenseDate">
							{(field) => (
								<>
									<Input
										id="expense-date"
										type="date"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="mt-1.5"
									/>
									{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
										<p
											key={`${error}-${index}`}
											className="text-destructive mt-1.5 text-xs"
										>
											{error}
										</p>
									))}
								</>
							)}
						</form.Field>
					</div>

					{/* Notes */}
					<div>
						<Label htmlFor="expense-notes" className="text-sm font-medium">
							{t("expenses.notesLabel")}
						</Label>
						<form.Field name="notes">
							{(field) => (
								<Textarea
									id="expense-notes"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={t("expenses.notesPlaceholder")}
									className="mt-1.5"
									rows={3}
								/>
							)}
						</form.Field>
					</div>

					<SheetFooter className="mt-auto flex flex-row justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							<X className="mr-2 h-4 w-4" />
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={isPending} className="gap-2">
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
