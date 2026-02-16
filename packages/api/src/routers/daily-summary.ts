import { db } from "@offline-sqlite/db";
import {
	payment,
	visit,
	visitAct,
	visitActTooth,
	patient,
	visitType,
} from "@offline-sqlite/db/schema/dental";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

import { router, protectedProcedure } from "../index";

function getStartOfDay(date: Date): Date {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	return start;
}

function getEndOfDay(date: Date): Date {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return end;
}

export const dailySummaryRouter = router({
	get: protectedProcedure.query(async ({ ctx }) => {
		const today = new Date();
		const startOfDay = getStartOfDay(today);
		const endOfDay = getEndOfDay(today);

		const todayVisits = await db
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
					gte(visit.visitTime, startOfDay.getTime()),
					lte(visit.visitTime, endOfDay.getTime()),
				),
			)
			.orderBy(desc(visit.visitTime));

		const visitIds = todayVisits.map((v) => v.visit.id);

		let totalExpected = 0;
		let totalCollected = 0;
		const proceduresByType: Record<string, number> = {};

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					price: visitAct.price,
					visitTypeId: visitAct.visitTypeId,
					visitTypeName: visitType.name,
				})
				.from(visitAct)
				.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						price: visitAct.price,
						visitTypeId: visitAct.visitTypeId,
						visitTypeName: visitType.name,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			totalExpected = actsData.reduce((sum, a) => sum + a.price, 0);

			for (const act of actsData) {
				proceduresByType[act.visitTypeName] = (proceduresByType[act.visitTypeName] || 0) + 1;
			}

			const paymentsData = await db
				.select({ amount: payment.amount })
				.from(payment)
				.where(eq(payment.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const morePayments = await db
					.select({ amount: payment.amount })
					.from(payment)
					.where(eq(payment.visitId, visitIds[i]!));
				paymentsData.push(...morePayments);
			}

			totalCollected = paymentsData.reduce((sum, p) => sum + p.amount, 0);
		}

		const visitsWithDetails = await Promise.all(
			todayVisits.map(async (v) => {
				const acts = await db
					.select({
						act: visitAct,
						visitType: visitType,
						teeth: sql<string>`json_group_array(${visitActTooth.toothId})`,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.leftJoin(visitActTooth, eq(visitAct.id, visitActTooth.visitActId))
					.where(eq(visitAct.visitId, v.visit.id))
					.groupBy(visitAct.id);

				const totalAmount = acts.reduce((sum, a) => sum + a.act.price, 0);

				const payments = await db
					.select({ amount: payment.amount })
					.from(payment)
					.where(eq(payment.visitId, v.visit.id));
				const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

				return {
					...v.visit,
					patient: v.patient,
					totalAmount,
					amountPaid,
					amountLeft: totalAmount - amountPaid,
					acts: acts.map((a) => ({
						...a.act,
						visitType: a.visitType,
						teeth: JSON.parse(a.teeth) as string[],
					})),
				};
			}),
		);

		const uniquePatients = new Set(todayVisits.map((v) => v.patient.id)).size;

		const newPatientsTodayResult = await db
			.select({ id: patient.id })
			.from(patient)
			.where(
				and(
					eq(patient.userId, ctx.session.user.id),
					gte(patient.createdAt, startOfDay),
					lte(patient.createdAt, endOfDay),
				),
			);

		const newPatientsToday = newPatientsTodayResult.length;

		let totalUnpaidAmount = 0;

		if (visitIds.length > 0) {
			for (const visitId of visitIds) {
				const visitActs = await db
					.select({ price: visitAct.price })
					.from(visitAct)
					.where(eq(visitAct.visitId, visitId));
				const visitTotal = visitActs.reduce((sum, a) => sum + a.price, 0);

				const visitPayments = await db
					.select({ amount: payment.amount })
					.from(payment)
					.where(eq(payment.visitId, visitId));
				const visitPaid = visitPayments.reduce((sum, p) => sum + p.amount, 0);

				const remaining = visitTotal - visitPaid;
				if (remaining > 0) {
					totalUnpaidAmount += remaining;
				}
			}
		}

		return {
			date: today.toISOString(),
			totalVisits: todayVisits.length,
			uniquePatients,
			newPatientsToday,
			totalExpected,
			totalCollected,
			totalRemaining: Math.max(0, totalExpected - totalCollected),
			totalUnpaidAmount,
			proceduresByType,
			visits: visitsWithDetails,
		};
	}),
});
