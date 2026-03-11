import { db } from "@offline-sqlite/db";
import { expenseType, expense } from "@offline-sqlite/db/schema/expense";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, like, sql, gte, lte, inArray } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

const generateId = () => crypto.randomUUID();

const expenseTypeCreateSchema = z.object({
	name: z.string().min(1),
});

const expenseTypeUpdateSchema = expenseTypeCreateSchema.partial().extend({
	id: z.string(),
});

export const expenseTypeRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(expenseType)
			.where(eq(expenseType.userId, ctx.session.user.id))
			.orderBy(desc(expenseType.createdAt));
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(expenseType)
			.where(and(eq(expenseType.id, input.id), eq(expenseType.userId, ctx.session.user.id)))
			.limit(1);

		return result[0] ?? null;
	}),

	create: protectedProcedure.input(expenseTypeCreateSchema).mutation(async ({ ctx, input }) => {
		// Check if expense type with this name already exists for this user
		const existing = await db
			.select()
			.from(expenseType)
			.where(and(eq(expenseType.userId, ctx.session.user.id), eq(expenseType.name, input.name)))
			.limit(1);

		if (existing.length > 0 && existing[0] !== undefined) {
			return { id: existing[0].id, existing: true };
		}

		const id = generateId();
		await db.insert(expenseType).values({
			id,
			name: input.name,
			userId: ctx.session.user.id,
		});

		return { id, existing: false };
	}),

	update: protectedProcedure.input(expenseTypeUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		await db
			.update(expenseType)
			.set(data)
			.where(and(eq(expenseType.id, id), eq(expenseType.userId, ctx.session.user.id)));
		return { id };
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.delete(expenseType)
			.where(and(eq(expenseType.id, input.id), eq(expenseType.userId, ctx.session.user.id)));
		return { id: input.id };
	}),
});

const expenseCreateSchema = z.object({
	expenseTypeId: z.string(),
	quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
	unitPrice: z.number().int().min(1, "Unit price must be greater than 0"),
	amount: z.number().int().min(1, "Amount must be greater than 0"),
	notes: z.string().optional(),
	expenseDate: z.number(),
});

const expenseUpdateSchema = z.object({
	id: z.string(),
	expenseTypeId: z.string().optional(),
	quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
	unitPrice: z.number().int().min(1, "Unit price must be greater than 0").optional(),
	amount: z.number().int().min(1, "Amount must be greater than 0").optional(),
	notes: z.string().optional(),
	expenseDate: z.number().optional(),
});

const expenseListSchema = z.object({
	expenseTypeIds: z.array(z.string()).optional(),
	query: z.string().optional(),
	dateFrom: z.number().optional(),
	dateTo: z.number().optional(),
	minAmount: z.number().int().min(0).optional(),
	maxAmount: z.number().int().min(0).optional(),
	sortBy: z.enum(["dateDesc", "dateAsc", "amountDesc", "amountAsc", "typeAsc", "typeDesc"]).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(10),
});

export const expenseRouter = router({
	create: protectedProcedure.input(expenseCreateSchema).mutation(async ({ ctx, input }) => {
		// Verify expense type belongs to user
		const typeExists = await db
			.select()
			.from(expenseType)
			.where(and(eq(expenseType.id, input.expenseTypeId), eq(expenseType.userId, ctx.session.user.id)))
			.limit(1);

		if (typeExists.length === 0 || typeExists[0] === undefined) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Expense type not found",
			});
		}

		const id = generateId();
		await db.insert(expense).values({
			id,
			expenseTypeId: input.expenseTypeId,
			quantity: input.quantity,
			unitPrice: input.unitPrice,
			amount: input.amount,
			notes: input.notes ?? null,
			expenseDate: new Date(input.expenseDate),
			userId: ctx.session.user.id,
		});

		return { id };
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select({
				id: expense.id,
				expenseTypeId: expense.expenseTypeId,
				quantity: expense.quantity,
				unitPrice: expense.unitPrice,
				amount: expense.amount,
				notes: expense.notes,
				expenseDate: expense.expenseDate,
				createdAt: expense.createdAt,
				expenseTypeName: expenseType.name,
			})
			.from(expense)
			.innerJoin(expenseType, eq(expense.expenseTypeId, expenseType.id))
			.where(and(eq(expense.id, input.id), eq(expense.userId, ctx.session.user.id)))
			.limit(1);

		return result[0] ?? null;
	}),

	list: protectedProcedure.input(expenseListSchema).query(async ({ ctx, input }) => {
		const sortBy = input.sortBy ?? "dateDesc";
		const offset = (input.page - 1) * input.pageSize;

		let orderByClause;
		if (sortBy === "dateAsc") {
			orderByClause = asc(expense.createdAt);
		} else if (sortBy === "dateDesc") {
			orderByClause = desc(expense.createdAt);
		} else if (sortBy === "amountDesc") {
			orderByClause = desc(expense.amount);
		} else if (sortBy === "amountAsc") {
			orderByClause = asc(expense.amount);
		} else if (sortBy === "typeAsc") {
			orderByClause = asc(expenseType.name);
		} else if (sortBy === "typeDesc") {
			orderByClause = desc(expenseType.name);
		} else {
			orderByClause = desc(expense.createdAt);
		}

		const whereCondition = and(
			eq(expense.userId, ctx.session.user.id),
			input.expenseTypeIds && input.expenseTypeIds.length > 0
				? inArray(expense.expenseTypeId, input.expenseTypeIds)
				: undefined,
			input.dateFrom !== undefined ? gte(expense.expenseDate, new Date(input.dateFrom)) : undefined,
			input.dateTo !== undefined ? lte(expense.expenseDate, new Date(input.dateTo)) : undefined,
			input.minAmount !== undefined ? gte(expense.amount, input.minAmount) : undefined,
			input.maxAmount !== undefined ? lte(expense.amount, input.maxAmount) : undefined,
			input.query && input.query.length > 0 ? like(expense.notes, `%${input.query}%`) : undefined,
		);

		const [items, totalResult] = await Promise.all([
			db
				.select({
					id: expense.id,
					expenseTypeId: expense.expenseTypeId,
					quantity: expense.quantity,
					unitPrice: expense.unitPrice,
					amount: expense.amount,
					notes: expense.notes,
					expenseDate: expense.expenseDate,
					createdAt: expense.createdAt,
					expenseTypeName: expenseType.name,
				})
				.from(expense)
				.innerJoin(expenseType, eq(expense.expenseTypeId, expenseType.id))
				.where(whereCondition)
				.orderBy(orderByClause)
				.limit(input.pageSize)
				.offset(offset),
			db
				.select({ total: sql<number>`count(*)` })
				.from(expense)
				.where(whereCondition),
		]);

		const total = Number(totalResult[0]?.total ?? 0);
		const totalPages = Math.max(1, Math.ceil(total / input.pageSize));

		return {
			items,
			total,
			page: input.page,
			pageSize: input.pageSize,
			totalPages,
		};
	}),

	update: protectedProcedure.input(expenseUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		// If updating expense type, verify it belongs to user
		if (data.expenseTypeId) {
			const typeExists = await db
				.select()
				.from(expenseType)
				.where(
					and(eq(expenseType.id, data.expenseTypeId), eq(expenseType.userId, ctx.session.user.id)),
				)
				.limit(1);

			if (typeExists.length === 0 || typeExists[0] === undefined) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense type not found",
				});
			}
		}

		// Build update data with proper types
		const updateData: {
			expenseTypeId?: string;
			quantity?: number;
			unitPrice?: number;
			amount?: number;
			notes?: string | null;
			expenseDate?: Date;
		} = {};

		if (data.expenseTypeId !== undefined) updateData.expenseTypeId = data.expenseTypeId;
		if (data.quantity !== undefined) updateData.quantity = data.quantity;
		if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
		if (data.amount !== undefined) updateData.amount = data.amount;
		if (data.notes !== undefined) updateData.notes = data.notes ?? null;
		if (data.expenseDate !== undefined) updateData.expenseDate = new Date(data.expenseDate);

		await db
			.update(expense)
			.set(updateData)
			.where(and(eq(expense.id, id), eq(expense.userId, ctx.session.user.id)));

		return { id };
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.delete(expense)
			.where(and(eq(expense.id, input.id), eq(expense.userId, ctx.session.user.id)));
		return { id: input.id };
	}),

	// Chart data queries
	getExpensesByType: protectedProcedure
		.input(
			z.object({
				dateFrom: z.number().optional(),
				dateTo: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const whereCondition = and(
				eq(expense.userId, ctx.session.user.id),
				input.dateFrom !== undefined ? gte(expense.expenseDate, new Date(input.dateFrom)) : undefined,
				input.dateTo !== undefined ? lte(expense.expenseDate, new Date(input.dateTo)) : undefined,
			);

			const result = await db
				.select({
					expenseTypeId: expenseType.id,
					expenseTypeName: expenseType.name,
					totalAmount: sql<number>`sum(${expense.amount})`,
					count: sql<number>`count(*)`,
				})
				.from(expense)
				.innerJoin(expenseType, eq(expense.expenseTypeId, expenseType.id))
				.where(whereCondition)
				.groupBy(expenseType.id, expenseType.name)
				.orderBy(sql`sum(${expense.amount}) DESC`);

			return result.map((item) => ({
				expenseTypeId: item.expenseTypeId,
				expenseTypeName: item.expenseTypeName,
				totalAmount: Number(item.totalAmount),
				count: Number(item.count),
			}));
		}),

	getExpensesByMonth: protectedProcedure
		.input(
			z.object({
				dateFrom: z.number(),
				dateTo: z.number(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const dateFrom = new Date(input.dateFrom);
			const dateTo = new Date(input.dateTo);
			dateTo.setHours(23, 59, 59, 999);

			const result = await db
				.select({
					expenseDate: expense.expenseDate,
					amount: expense.amount,
				})
				.from(expense)
				.where(
					and(
						eq(expense.userId, ctx.session.user.id),
						gte(expense.expenseDate, dateFrom),
						lte(expense.expenseDate, dateTo),
					),
				);

			const groupedByMonth = new Map<string, { month: string; totalAmount: number; count: number }>();

			for (const item of result) {
				const date = new Date(item.expenseDate);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
				const existing = groupedByMonth.get(monthKey);

				if (existing) {
					existing.totalAmount += item.amount;
					existing.count += 1;
				} else {
					groupedByMonth.set(monthKey, {
						month: monthKey,
						totalAmount: item.amount,
						count: 1,
					});
				}
			}

			return Array.from(groupedByMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
		}),
});
