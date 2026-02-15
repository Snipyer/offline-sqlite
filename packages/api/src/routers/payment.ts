import { db } from "@offline-sqlite/db";
import { payment, visit, visitAct, patient, paymentMethodEnum } from "@offline-sqlite/db/schema/dental";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { router, protectedProcedure } from "../index";

const generateId = () => crypto.randomUUID();

const paymentCreateSchema = z.object({
	visitId: z.string(),
	amount: z.number().int().min(1, "Amount must be greater than 0"),
	paymentMethod: z.enum(paymentMethodEnum).default("cash"),
	notes: z.string().optional(),
	recordedAt: z.number().optional(),
});

async function getVisitTotalAmount(visitId: string): Promise<number> {
	const acts = await db
		.select({ price: visitAct.price })
		.from(visitAct)
		.where(eq(visitAct.visitId, visitId));
	return acts.reduce((sum, a) => sum + a.price, 0);
}

async function getVisitTotalPaid(visitId: string): Promise<number> {
	const payments = await db
		.select({ amount: payment.amount })
		.from(payment)
		.where(eq(payment.visitId, visitId));
	return payments.reduce((sum, p) => sum + p.amount, 0);
}

export const paymentRouter = router({
	create: protectedProcedure.input(paymentCreateSchema).mutation(async ({ ctx, input }) => {
		const existingVisit = await db
			.select()
			.from(visit)
			.where(and(eq(visit.id, input.visitId), eq(visit.userId, ctx.session.user.id)))
			.limit(1);

		if (existingVisit.length === 0 || existingVisit[0] === undefined) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Visit not found",
			});
		}

		const totalAmount = await getVisitTotalAmount(input.visitId);
		const totalPaid = await getVisitTotalPaid(input.visitId);
		const remainingBalance = totalAmount - totalPaid;

		if (input.amount > remainingBalance) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Payment amount exceeds remaining balance of ${remainingBalance}`,
			});
		}

		const paymentId = generateId();
		const now = new Date();

		await db.insert(payment).values({
			id: paymentId,
			visitId: input.visitId,
			amount: input.amount,
			paymentMethod: input.paymentMethod,
			notes: input.notes ?? null,
			recordedAt: input.recordedAt ? new Date(input.recordedAt) : now,
			userId: ctx.session.user.id,
		});

		return {
			id: paymentId,
			visitId: input.visitId,
			amount: input.amount,
			paymentMethod: input.paymentMethod,
			recordedAt: input.recordedAt ?? now.getTime(),
		};
	}),

	listByVisit: protectedProcedure.input(z.object({ visitId: z.string() })).query(async ({ ctx, input }) => {
		const visitExists = await db
			.select({ id: visit.id })
			.from(visit)
			.where(and(eq(visit.id, input.visitId), eq(visit.userId, ctx.session.user.id)))
			.limit(1);

		if (visitExists.length === 0) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Visit not found",
			});
		}

		const payments = await db
			.select()
			.from(payment)
			.where(eq(payment.visitId, input.visitId))
			.orderBy(desc(payment.recordedAt));

		return payments;
	}),

	listByPatient: protectedProcedure
		.input(z.object({ patientId: z.string() }))
		.query(async ({ ctx, input }) => {
			const patientExists = await db
				.select({ id: patient.id })
				.from(patient)
				.where(and(eq(patient.id, input.patientId), eq(patient.userId, ctx.session.user.id)))
				.limit(1);

			if (patientExists.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Patient not found",
				});
			}

			const visitsData = await db
				.select({ id: visit.id })
				.from(visit)
				.where(
					and(
						eq(visit.patientId, input.patientId),
						eq(visit.userId, ctx.session.user.id),
						eq(visit.isDeleted, false),
					),
				);

			const visitIds = visitsData.map((v) => v.id).filter((id): id is string => id !== undefined);

			if (visitIds.length === 0) {
				return [];
			}

			const allPayments = await db
				.select()
				.from(payment)
				.where(eq(payment.visitId, visitIds[0]!))
				.orderBy(desc(payment.recordedAt));

			for (let i = 1; i < visitIds.length; i++) {
				const visitId = visitIds[i];
				if (!visitId) continue;
				const morePayments = await db
					.select()
					.from(payment)
					.where(eq(payment.visitId, visitId))
					.orderBy(desc(payment.recordedAt));
				allPayments.push(...morePayments);
			}

			allPayments.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

			return allPayments;
		}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(payment)
			.innerJoin(visit, eq(payment.visitId, visit.id))
			.where(and(eq(payment.id, input.id), eq(visit.userId, ctx.session.user.id)))
			.limit(1);

		if (result.length === 0 || result[0] === undefined) {
			return null;
		}

		return result[0].payment;
	}),

	getVisitSummary: protectedProcedure
		.input(z.object({ visitId: z.string() }))
		.query(async ({ ctx, input }) => {
			const visitExists = await db
				.select()
				.from(visit)
				.where(and(eq(visit.id, input.visitId), eq(visit.userId, ctx.session.user.id)))
				.limit(1);

			if (visitExists.length === 0 || visitExists[0] === undefined) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Visit not found",
				});
			}

			const totalAmount = await getVisitTotalAmount(input.visitId);
			const totalPaid = await getVisitTotalPaid(input.visitId);

			return {
				visitId: input.visitId,
				totalAmount,
				totalPaid,
				remainingBalance: totalAmount - totalPaid,
			};
		}),
});
