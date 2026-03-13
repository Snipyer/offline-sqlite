import { db } from "@offline-sqlite/db";
import { visitType } from "@offline-sqlite/db/schema/dental";
import { TRPCError } from "@trpc/server";
import { eq, and, asc, desc, like, sql } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";
import { capitalizeTypeName, normalizeTypeNames } from "../utils/type-name";

const generateId = () => crypto.randomUUID();

const visitTypeCreateSchema = z.object({
	name: z.string().min(1),
});

const visitTypeUpdateSchema = visitTypeCreateSchema.partial().extend({
	id: z.string(),
});

const paginationSchema = z.object({
	query: z.string().optional(),
	sortBy: z.enum(["createdDesc", "createdAsc", "nameAsc", "nameDesc"]).optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(10),
});

export const visitTypeRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(visitType)
			.where(eq(visitType.userId, ctx.session.user.id))
			.orderBy(desc(visitType.createdAt))
			.then((items) => items.map((item) => ({ ...item, name: capitalizeTypeName(item.name) })));
	}),

	listPaginated: protectedProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
		const sortBy = input.sortBy ?? "createdDesc";
		const offset = (input.page - 1) * input.pageSize;
		const whereCondition = and(
			eq(visitType.userId, ctx.session.user.id),
			input.query && input.query.length > 0 ? like(visitType.name, `%${input.query}%`) : undefined,
		);

		const orderByClause =
			sortBy === "createdAsc"
				? asc(visitType.createdAt)
				: sortBy === "nameAsc"
					? asc(visitType.name)
					: sortBy === "nameDesc"
						? desc(visitType.name)
						: desc(visitType.createdAt);

		const [items, totalResult] = await Promise.all([
			db
				.select()
				.from(visitType)
				.where(whereCondition)
				.orderBy(orderByClause)
				.limit(input.pageSize)
				.offset(offset),
			db
				.select({ total: sql<number>`count(*)` })
				.from(visitType)
				.where(whereCondition),
		]);

		const total = Number(totalResult[0]?.total ?? 0);
		const totalPages = Math.max(1, Math.ceil(total / input.pageSize));

		return {
			items: items.map((item) => ({ ...item, name: capitalizeTypeName(item.name) })),
			total,
			page: input.page,
			pageSize: input.pageSize,
			totalPages,
		};
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(visitType)
			.where(and(eq(visitType.id, input.id), eq(visitType.userId, ctx.session.user.id)))
			.limit(1);

		const item = result[0];
		if (!item) {
			return null;
		}

		return {
			...item,
			name: capitalizeTypeName(item.name),
		};
	}),

	create: protectedProcedure.input(visitTypeCreateSchema).mutation(async ({ ctx, input }) => {
		const names = normalizeTypeNames(input.name);

		if (names.length === 0) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Visit type name is required",
			});
		}

		const entries = names.map((name) => ({
			id: generateId(),
			name,
			userId: ctx.session.user.id,
		}));

		const firstEntry = entries[0];
		if (!firstEntry) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Visit type name is required",
			});
		}

		await db.insert(visitType).values(entries);

		return { id: firstEntry.id, ids: entries.map((entry) => entry.id) };
	}),

	update: protectedProcedure.input(visitTypeUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		const normalizedData = {
			...data,
			...(data.name !== undefined ? { name: capitalizeTypeName(data.name) } : {}),
		};

		await db
			.update(visitType)
			.set(normalizedData)
			.where(and(eq(visitType.id, id), eq(visitType.userId, ctx.session.user.id)));
		return { id };
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.delete(visitType)
			.where(and(eq(visitType.id, input.id), eq(visitType.userId, ctx.session.user.id)));
		return { id: input.id };
	}),
});
