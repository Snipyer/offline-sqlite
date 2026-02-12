import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const sexEnum = ["M", "F"] as const;

export const patient = sqliteTable(
	"patient",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		sex: text("sex", { enum: sexEnum }).notNull(),
		age: integer("age").notNull(),
		phone: text("phone"),
		address: text("address"),
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
	(table) => [index("patient_userId_idx").on(table.userId), index("patient_name_idx").on(table.name)],
);

export const visitType = sqliteTable(
	"visit_type",
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
	(table) => [index("visit_type_userId_idx").on(table.userId), index("visit_type_name_idx").on(table.name)],
);

export const visit = sqliteTable(
	"visit",
	{
		id: text("id").primaryKey(),
		patientId: text("patient_id")
			.notNull()
			.references(() => patient.id, { onDelete: "cascade" }),
		visitTime: integer("visit_time").notNull(),
		notes: text("notes"),
		amountPaid: integer("amount_paid").notNull().default(0),
		isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
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
		index("visit_userId_idx").on(table.userId),
		index("visit_patientId_idx").on(table.patientId),
		index("visit_visitTime_idx").on(table.visitTime),
		index("visit_isDeleted_idx").on(table.isDeleted),
	],
);

export const visitAct = sqliteTable(
	"visit_act",
	{
		id: text("id").primaryKey(),
		visitId: text("visit_id")
			.notNull()
			.references(() => visit.id, { onDelete: "cascade" }),
		visitTypeId: text("visit_type_id")
			.notNull()
			.references(() => visitType.id, { onDelete: "cascade" }),
		price: integer("price").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("visit_act_visitId_idx").on(table.visitId),
		index("visit_act_visitTypeId_idx").on(table.visitTypeId),
	],
);

export const visitActTooth = sqliteTable(
	"visit_act_tooth",
	{
		id: text("id").primaryKey(),
		visitActId: text("visit_act_id")
			.notNull()
			.references(() => visitAct.id, { onDelete: "cascade" }),
		toothId: text("tooth_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("visit_act_tooth_visitActId_idx").on(table.visitActId),
		index("visit_act_tooth_toothId_idx").on(table.toothId),
	],
);

export const patientRelations = relations(patient, ({ one, many }) => ({
	user: one(user, {
		fields: [patient.userId],
		references: [user.id],
	}),
	visits: many(visit),
}));

export const visitTypeRelations = relations(visitType, ({ one, many }) => ({
	user: one(user, {
		fields: [visitType.userId],
		references: [user.id],
	}),
	acts: many(visitAct),
}));

export const visitRelations = relations(visit, ({ one, many }) => ({
	patient: one(patient, {
		fields: [visit.patientId],
		references: [patient.id],
	}),
	user: one(user, {
		fields: [visit.userId],
		references: [user.id],
	}),
	acts: many(visitAct),
}));

export const visitActRelations = relations(visitAct, ({ one, many }) => ({
	visit: one(visit, {
		fields: [visitAct.visitId],
		references: [visit.id],
	}),
	visitType: one(visitType, {
		fields: [visitAct.visitTypeId],
		references: [visitType.id],
	}),
	teeth: many(visitActTooth),
}));

export const visitActToothRelations = relations(visitActTooth, ({ one }) => ({
	visitAct: one(visitAct, {
		fields: [visitActTooth.visitActId],
		references: [visitAct.id],
	}),
}));
