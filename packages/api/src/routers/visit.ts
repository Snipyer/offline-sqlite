import { db } from "@offline-sqlite/db";
import { visit, visitAct, visitActTooth, patient, visitType } from "@offline-sqlite/db/schema/dental";
import { eq, and, like, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { router, protectedProcedure } from "../index";
import { getVisitTotalPaid } from "../utils/payment";

const generateId = () => crypto.randomUUID();

const visitActInputSchema = z.object({
	visitTypeId: z.string(),
	price: z.number().int().min(1, "Price must be greater than 0"),
	teeth: z.array(z.string()).min(1),
});

const visitCreateSchema = z.object({
	patientId: z.string(),
	visitTime: z.number(),
	notes: z.string().optional(),
	acts: z.array(visitActInputSchema).min(1),
});

const visitUpdateSchema = z.object({
	id: z.string(),
	visitTime: z.number().optional(),
	notes: z.string().optional(),
	acts: z.array(visitActInputSchema).min(1).optional(),
});

const visitFilterSchema = z.object({
	dateFrom: z.number().optional(),
	dateTo: z.number().optional(),
	patientName: z.string().optional(),
	visitTypeId: z.string().optional(),
});

async function getVisitWithPaymentData(
	visitData: typeof visit.$inferSelect,
	patientData: typeof patient.$inferSelect,
) {
	const acts = await db
		.select({
			act: visitAct,
			visitType: visitType,
			teeth: sql<string>`json_group_array(${visitActTooth.toothId})`,
		})
		.from(visitAct)
		.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
		.leftJoin(visitActTooth, eq(visitAct.id, visitActTooth.visitActId))
		.where(eq(visitAct.visitId, visitData.id))
		.groupBy(visitAct.id);

	const totalAmount = acts.reduce((sum, a) => sum + a.act.price, 0);
	const totalPaid = await getVisitTotalPaid(visitData.id);

	return {
		...visitData,
		patient: patientData,
		totalAmount,
		amountPaid: totalPaid,
		amountLeft: totalAmount - totalPaid,
		acts: acts.map((a) => ({
			...a.act,
			visitType: a.visitType,
			teeth: JSON.parse(a.teeth) as string[],
		})),
	};
}

export const visitRouter = router({
	list: protectedProcedure.input(visitFilterSchema).query(async ({ ctx, input }) => {
		let visitQuery = db
			.select({
				visit: visit,
				patient: patient,
			})
			.from(visit)
			.innerJoin(patient, eq(visit.patientId, patient.id))
			.where(
				and(
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
					input.dateFrom !== undefined ? gte(visit.visitTime, input.dateFrom) : undefined,
					input.dateTo !== undefined ? lte(visit.visitTime, input.dateTo) : undefined,
					input.patientName !== undefined && input.patientName.length > 0
						? like(patient.name, `%${input.patientName}%`)
						: undefined,
				),
			)
			.orderBy(desc(visit.visitTime));

		let visits = await visitQuery;

		if (input.visitTypeId !== undefined) {
			const actsWithType = await db
				.select({ visitId: visitAct.visitId })
				.from(visitAct)
				.where(eq(visitAct.visitTypeId, input.visitTypeId));
			const visitIds = actsWithType.map((a) => a.visitId);
			visits = visits.filter((v) => visitIds.includes(v.visit.id));
		}

		const visitsWithActs = await Promise.all(
			visits.map(async (v) => getVisitWithPaymentData(v.visit, v.patient)),
		);

		return visitsWithActs;
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select({
				visit: visit,
				patient: patient,
			})
			.from(visit)
			.innerJoin(patient, eq(visit.patientId, patient.id))
			.where(
				and(
					eq(visit.id, input.id),
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
				),
			)
			.limit(1);

		if (result.length === 0 || result[0] === undefined) {
			return null;
		}

		return getVisitWithPaymentData(result[0].visit, result[0].patient);
	}),

	create: protectedProcedure.input(visitCreateSchema).mutation(async ({ ctx, input }) => {
		const visitId = generateId();
		const totalAmount = input.acts.reduce((sum, act) => sum + act.price, 0);

		await db.insert(visit).values({
			id: visitId,
			patientId: input.patientId,
			visitTime: input.visitTime,
			notes: input.notes ?? null,
			isDeleted: false,
			userId: ctx.session.user.id,
		});

		for (const act of input.acts) {
			const actId = generateId();
			await db.insert(visitAct).values({
				id: actId,
				visitId,
				visitTypeId: act.visitTypeId,
				price: act.price,
			});

			for (const toothId of act.teeth) {
				await db.insert(visitActTooth).values({
					id: generateId(),
					visitActId: actId,
					toothId,
				});
			}
		}

		return { id: visitId, totalAmount };
	}),

	update: protectedProcedure.input(visitUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, acts, ...updateData } = input;

		const existingVisit = await db
			.select()
			.from(visit)
			.where(and(eq(visit.id, id), eq(visit.userId, ctx.session.user.id)))
			.limit(1);

		if (existingVisit.length === 0 || existingVisit[0] === undefined) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Visit not found" });
		}

		let totalAmount = 0;

		if (acts !== undefined) {
			await db.delete(visitAct).where(eq(visitAct.visitId, id));
			totalAmount = acts.reduce((sum, act) => sum + act.price, 0);

			for (const act of acts) {
				const actId = generateId();
				await db.insert(visitAct).values({
					id: actId,
					visitId: id,
					visitTypeId: act.visitTypeId,
					price: act.price,
				});

				for (const toothId of act.teeth) {
					await db.insert(visitActTooth).values({
						id: generateId(),
						visitActId: actId,
						toothId,
					});
				}
			}
		} else {
			const existingActs = await db
				.select({ price: visitAct.price })
				.from(visitAct)
				.where(eq(visitAct.visitId, id));
			totalAmount = existingActs.reduce((sum, a) => sum + a.price, 0);
		}

		const setData: Record<string, unknown> = {};
		if (updateData.visitTime !== undefined) setData.visitTime = updateData.visitTime;
		if (updateData.notes !== undefined) setData.notes = updateData.notes;

		if (Object.keys(setData).length > 0) {
			await db
				.update(visit)
				.set(setData)
				.where(and(eq(visit.id, id), eq(visit.userId, ctx.session.user.id)));
		}

		const totalPaid = await getVisitTotalPaid(id);

		return { id, totalAmount, amountPaid: totalPaid, amountLeft: totalAmount - totalPaid };
	}),

	softDelete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.update(visit)
			.set({ isDeleted: true })
			.where(and(eq(visit.id, input.id), eq(visit.userId, ctx.session.user.id)));
		return { id: input.id };
	}),

	restore: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.update(visit)
			.set({ isDeleted: false })
			.where(and(eq(visit.id, input.id), eq(visit.userId, ctx.session.user.id)));
		return { id: input.id };
	}),
});
