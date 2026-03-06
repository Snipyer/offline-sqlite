import { db } from "@offline-sqlite/db";
import {
	payment,
	visit,
	visitAct,
	visitActTooth,
	patient,
	visitType,
} from "@offline-sqlite/db/schema/dental";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

import { router, protectedProcedure } from "../index";
import { z } from "zod";

const dateRangeSchema = z.object({
	startDate: z.string(),
	endDate: z.string(),
});

export const reportsRouter = router({
	getSummary: protectedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
		const startDate = new Date(input.startDate);
		const endDate = new Date(input.endDate);
		endDate.setHours(23, 59, 59, 999);

		const visitsInRange = await db
			.select({ id: visit.id, totalAmount: sql<number>`0` })
			.from(visit)
			.where(
				and(
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
					gte(visit.visitTime, startDate.getTime()),
					lte(visit.visitTime, endDate.getTime()),
				),
			);

		const visitIds = visitsInRange.map((v) => v.id);

		let totalExpected = 0;
		let totalCollected = 0;

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					price: visitAct.price,
				})
				.from(visitAct)
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						price: visitAct.price,
					})
					.from(visitAct)
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			totalExpected = actsData.reduce((sum, a) => sum + a.price, 0);

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

		return {
			totalRevenue: totalCollected,
			totalVisits: visitIds.length,
			avgPerVisit: visitIds.length > 0 ? Math.round(totalCollected / visitIds.length) : 0,
			outstanding: Math.max(0, totalExpected - totalCollected),
		};
	}),

	getRevenueByPeriod: protectedProcedure
		.input(dateRangeSchema.extend({ groupBy: z.enum(["day", "week", "month"]).default("day") }))
		.query(async ({ ctx, input }) => {
			const startDate = new Date(input.startDate);
			const endDate = new Date(input.endDate);
			endDate.setHours(23, 59, 59, 999);

			const visitsInRange = await db
				.select({
					id: visit.id,
					visitTime: visit.visitTime,
				})
				.from(visit)
				.where(
					and(
						eq(visit.userId, ctx.session.user.id),
						eq(visit.isDeleted, false),
						gte(visit.visitTime, startDate.getTime()),
						lte(visit.visitTime, endDate.getTime()),
					),
				);

			const visitIds = visitsInRange.map((v) => v.id);

			const revenueByPeriod: Record<string, number> = {};
			const unpaidByPeriod: Record<string, number> = {};

			const toPeriodKey = (date: Date) => {
				if (input.groupBy === "day") {
					return date.toISOString().split("T")[0]!;
				}

				if (input.groupBy === "week") {
					const weekStart = new Date(date);
					weekStart.setDate(date.getDate() - date.getDay());
					return weekStart.toISOString().split("T")[0]!;
				}

				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			};

			if (visitIds.length > 0) {
				const actsData = await db
					.select({
						visitId: visitAct.visitId,
						price: visitAct.price,
					})
					.from(visitAct)
					.where(inArray(visitAct.visitId, visitIds));

				const totalByVisit = new Map<string, number>();

				for (const act of actsData) {
					totalByVisit.set(act.visitId, (totalByVisit.get(act.visitId) ?? 0) + act.price);
				}

				const paymentsData = await db
					.select({
						visitId: payment.visitId,
						amount: payment.amount,
						recordedAt: payment.recordedAt,
					})
					.from(payment)
					.where(and(inArray(payment.visitId, visitIds), lte(payment.recordedAt, endDate)));

				const paidByVisit = new Map<string, number>();

				for (const p of paymentsData) {
					paidByVisit.set(p.visitId, (paidByVisit.get(p.visitId) ?? 0) + p.amount);

					if (p.recordedAt >= startDate) {
						const key = toPeriodKey(new Date(p.recordedAt));
						revenueByPeriod[key] = (revenueByPeriod[key] || 0) + p.amount;
					}
				}

				for (const v of visitsInRange) {
					const total = totalByVisit.get(v.id) ?? 0;
					const paid = paidByVisit.get(v.id) ?? 0;
					const unpaid = Math.max(0, total - paid);

					if (unpaid > 0) {
						const key = toPeriodKey(new Date(v.visitTime));
						unpaidByPeriod[key] = (unpaidByPeriod[key] || 0) + unpaid;
					}
				}
			}

			const allPeriods = new Set([...Object.keys(revenueByPeriod), ...Object.keys(unpaidByPeriod)]);

			const result = Array.from(allPeriods)
				.map((period) => ({
					period,
					revenue: revenueByPeriod[period] ?? 0,
					unpaid: unpaidByPeriod[period] ?? 0,
				}))
				.sort((a, b) => a.period.localeCompare(b.period));

			return result;
		}),

	getRevenueByTreatment: protectedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
		const startDate = new Date(input.startDate);
		const endDate = new Date(input.endDate);
		endDate.setHours(23, 59, 59, 999);

		const visitsInRange = await db
			.select({ id: visit.id })
			.from(visit)
			.where(
				and(
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
					gte(visit.visitTime, startDate.getTime()),
					lte(visit.visitTime, endDate.getTime()),
				),
			);

		const visitIds = visitsInRange.map((v) => v.id);

		const revenueByTreatment: Record<string, number> = {};

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					price: visitAct.price,
					visitTypeName: visitType.name,
				})
				.from(visitAct)
				.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						price: visitAct.price,
						visitTypeName: visitType.name,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			for (const act of actsData) {
				revenueByTreatment[act.visitTypeName] =
					(revenueByTreatment[act.visitTypeName] || 0) + act.price;
			}
		}

		const result = Object.entries(revenueByTreatment)
			.map(([treatment, revenue]) => ({ treatment, revenue }))
			.sort((a, b) => b.revenue - a.revenue);

		return result;
	}),

	getPatientStats: protectedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
		const startDate = new Date(input.startDate);
		const endDate = new Date(input.endDate);
		endDate.setHours(23, 59, 59, 999);

		const newPatientsResult = await db
			.select({ id: patient.id })
			.from(patient)
			.where(
				and(
					eq(patient.userId, ctx.session.user.id),
					gte(patient.createdAt, startDate),
					lte(patient.createdAt, endDate),
				),
			);

		const newPatients = newPatientsResult.length;

		const visitsInRange = await db
			.select({
				patientId: visit.patientId,
			})
			.from(visit)
			.where(
				and(
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
					gte(visit.visitTime, startDate.getTime()),
					lte(visit.visitTime, endDate.getTime()),
				),
			);

		const patientIdsInRange = new Set(visitsInRange.map((v) => v.patientId));

		const patientsWithPriorVisits = new Set<string>();

		for (const patientId of patientIdsInRange) {
			const priorVisit = await db
				.select({ id: visit.id })
				.from(visit)
				.where(
					and(
						eq(visit.userId, ctx.session.user.id),
						eq(visit.patientId, patientId),
						eq(visit.isDeleted, false),
						lte(visit.visitTime, startDate.getTime() - 1),
					),
				)
				.limit(1);

			if (priorVisit.length > 0) {
				patientsWithPriorVisits.add(patientId);
			}
		}

		const returningPatients = patientsWithPriorVisits.size;
		const activePatients = patientIdsInRange.size;

		return {
			newPatients,
			returningPatients,
			activePatients,
		};
	}),

	getTreatmentStats: protectedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
		const startDate = new Date(input.startDate);
		const endDate = new Date(input.endDate);
		endDate.setHours(23, 59, 59, 999);

		const visitsInRange = await db
			.select({ id: visit.id })
			.from(visit)
			.where(
				and(
					eq(visit.userId, ctx.session.user.id),
					eq(visit.isDeleted, false),
					gte(visit.visitTime, startDate.getTime()),
					lte(visit.visitTime, endDate.getTime()),
				),
			);

		const visitIds = visitsInRange.map((v) => v.id);

		const treatmentCounts: Record<string, number> = {};
		const toothCounts: Record<string, number> = {};

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					visitTypeName: visitType.name,
				})
				.from(visitAct)
				.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						visitTypeName: visitType.name,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			for (const act of actsData) {
				treatmentCounts[act.visitTypeName] = (treatmentCounts[act.visitTypeName] || 0) + 1;
			}

			const actIdsResult = await db
				.select({ id: visitAct.id })
				.from(visitAct)
				.where(inArray(visitAct.visitId, visitIds));

			const actIds = actIdsResult.map((a) => a.id);

			if (actIds.length > 0) {
				const teethResult = await db
					.select({
						toothId: visitActTooth.toothId,
					})
					.from(visitActTooth)
					.where(inArray(visitActTooth.visitActId, actIds));

				for (const tooth of teethResult) {
					toothCounts[tooth.toothId] = (toothCounts[tooth.toothId] || 0) + 1;
				}
			}
		}

		const topTreatments = Object.entries(treatmentCounts)
			.map(([treatment, count]) => ({ treatment, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const topTeeth = Object.entries(toothCounts)
			.map(([toothId, count]) => ({ toothId, count }))
			.sort((a, b) => b.count - a.count);

		return {
			topTreatments,
			topTeeth,
		};
	}),
});
