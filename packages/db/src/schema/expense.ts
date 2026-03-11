import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const expenseType = sqliteTable(
	"expense_type",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("expense_type_userId_idx").on(table.userId),
		index("expense_type_name_idx").on(table.name),
	],
);

export const expense = sqliteTable(
	"expense",
	{
		id: text("id").primaryKey(),
		expenseTypeId: text("expense_type_id")
			.notNull()
			.references(() => expenseType.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull().default(1),
		unitPrice: integer("unit_price").notNull(),
		amount: integer("amount").notNull(),
		notes: text("notes"),
		expenseDate: integer("expense_date", { mode: "timestamp_ms" }).notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("expense_userId_idx").on(table.userId),
		index("expense_expenseTypeId_idx").on(table.expenseTypeId),
		index("expense_expenseDate_idx").on(table.expenseDate),
	],
);

export const expenseTypeRelations = relations(expenseType, ({ one, many }) => ({
	user: one(user, {
		fields: [expenseType.userId],
		references: [user.id],
	}),
	expenses: many(expense),
}));

export const expenseRelations = relations(expense, ({ one }) => ({
	user: one(user, {
		fields: [expense.userId],
		references: [user.id],
	}),
	expenseType: one(expenseType, {
		fields: [expense.expenseTypeId],
		references: [expenseType.id],
	}),
}));
