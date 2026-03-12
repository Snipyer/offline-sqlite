import z from "zod";

export function createExpenseSchema(t: (key: string) => string) {
	return z.object({
		expenseTypeId: z.string().min(1, t("expenses.validation.typeRequired")),
		quantity: z.number().int().min(1, t("expenses.validation.quantityMin")),
		unitPrice: z.number().int().min(1, t("expenses.validation.unitPriceMin")),
		notes: z.string(),
		expenseDate: z.string().min(1, t("expenses.validation.dateRequired")),
	});
}
