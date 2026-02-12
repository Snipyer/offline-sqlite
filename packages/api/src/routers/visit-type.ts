import { db } from "@offline-sqlite/db";
import { visitType } from "@offline-sqlite/db/schema/dental";
import { eq, and, desc } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

const generateId = () => crypto.randomUUID();

const visitTypeCreateSchema = z.object({
	name: z.string().min(1),
});

const visitTypeUpdateSchema = visitTypeCreateSchema.partial().extend({
	id: z.string(),
});

export const visitTypeRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(visitType)
			.where(eq(visitType.userId, ctx.session.user.id))
			.orderBy(desc(visitType.createdAt));
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(visitType)
			.where(and(eq(visitType.id, input.id), eq(visitType.userId, ctx.session.user.id)))
			.limit(1);

		return result[0] ?? null;
	}),

	create: protectedProcedure.input(visitTypeCreateSchema).mutation(async ({ ctx, input }) => {
		const id = generateId();
		await db.insert(visitType).values({
			id,
			name: input.name,
			userId: ctx.session.user.id,
		});
		return { id };
	}),

	update: protectedProcedure.input(visitTypeUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		await db
			.update(visitType)
			.set(data)
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
