import { db } from "@offline-sqlite/db";
import { patient } from "@offline-sqlite/db/schema/dental";
import { eq, and, like, desc } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

const generateId = () => crypto.randomUUID();

const sexEnum = z.enum(["M", "F"]);

const patientCreateSchema = z.object({
	name: z.string().min(1),
	sex: sexEnum,
	age: z.number().int().min(0).max(150),
	phone: z.string().optional(),
	address: z.string().optional(),
});

const patientUpdateSchema = patientCreateSchema.partial().extend({
	id: z.string(),
});

export const patientRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		return await db
			.select()
			.from(patient)
			.where(eq(patient.userId, ctx.session.user.id))
			.orderBy(desc(patient.createdAt));
	}),

	search: protectedProcedure
		.input(
			z.object({
				query: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			return await db
				.select()
				.from(patient)
				.where(and(eq(patient.userId, ctx.session.user.id), like(patient.name, `%${input.query}%`)))
				.limit(20);
		}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(patient)
			.where(and(eq(patient.id, input.id), eq(patient.userId, ctx.session.user.id)))
			.limit(1);

		return result[0] ?? null;
	}),

	create: protectedProcedure.input(patientCreateSchema).mutation(async ({ ctx, input }) => {
		const id = generateId();
		await db.insert(patient).values({
			id,
			name: input.name,
			sex: input.sex,
			age: input.age,
			phone: input.phone ?? null,
			address: input.address ?? null,
			userId: ctx.session.user.id,
		});
		return { id };
	}),

	update: protectedProcedure.input(patientUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;
		await db
			.update(patient)
			.set(data)
			.where(and(eq(patient.id, id), eq(patient.userId, ctx.session.user.id)));
		return { id };
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.delete(patient)
			.where(and(eq(patient.id, input.id), eq(patient.userId, ctx.session.user.id)));
		return { id: input.id };
	}),
});
