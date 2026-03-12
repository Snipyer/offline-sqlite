import { db } from "@offline-sqlite/db";
import { payment, visit, visitAct, patient, visitType } from "@offline-sqlite/db/schema/dental";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

import { router, protectedProcedure } from "../index";
import { z } from "zod";
import { capitalizePatientName } from "../utils/patient";

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

		let totalCollected = 0;
		let outstanding = 0;

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
				})
				.from(payment)
				.where(and(inArray(payment.visitId, visitIds), lte(payment.recordedAt, endDate)));

			totalCollected = paymentsData.reduce((sum, p) => sum + p.amount, 0);

			const paidByVisit = new Map<string, number>();

			for (const paymentRow of paymentsData) {
				paidByVisit.set(
					paymentRow.visitId,
					(paidByVisit.get(paymentRow.visitId) ?? 0) + paymentRow.amount,
				);
			}

			for (const visitId of visitIds) {
				const total = totalByVisit.get(visitId) ?? 0;
				const paid = paidByVisit.get(visitId) ?? 0;
				outstanding += Math.max(0, total - paid);
			}
		}

		return {
			totalRevenue: totalCollected,
			totalVisits: visitIds.length,
			avgPerVisit: visitIds.length > 0 ? Math.round(totalCollected / visitIds.length) : 0,
			outstanding,
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

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					price: visitAct.price,
					visitTypeId: visitType.id,
					visitTypeName: visitType.name,
				})
				.from(visitAct)
				.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						price: visitAct.price,
						visitTypeId: visitType.id,
						visitTypeName: visitType.name,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			const revenueByTreatment: Record<string, { revenue: number; visitTypeId: string }> = {};

			for (const act of actsData) {
				if (!revenueByTreatment[act.visitTypeName]) {
					revenueByTreatment[act.visitTypeName] = { revenue: 0, visitTypeId: act.visitTypeId };
				}
				revenueByTreatment[act.visitTypeName]!.revenue += act.price;
			}

			const result = Object.entries(revenueByTreatment)
				.map(([treatment, data]) => ({
					treatment,
					revenue: data.revenue,
					visitTypeId: data.visitTypeId,
				}))
				.sort((a, b) => b.revenue - a.revenue);

			return result;
		}

		return [];
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
		let returningPatients = 0;

		if (patientIdsInRange.size > 0) {
			const visitsUntilRangeEnd = await db
				.select({
					patientId: visit.patientId,
				})
				.from(visit)
				.where(
					and(
						eq(visit.userId, ctx.session.user.id),
						eq(visit.isDeleted, false),
						inArray(visit.patientId, Array.from(patientIdsInRange)),
						lte(visit.visitTime, endDate.getTime()),
					),
				);

			const visitsByPatient = new Map<string, number>();

			for (const row of visitsUntilRangeEnd) {
				visitsByPatient.set(row.patientId, (visitsByPatient.get(row.patientId) ?? 0) + 1);
			}

			returningPatients = Array.from(visitsByPatient.values()).filter((count) => count > 1).length;
		}

		const activePatients = patientIdsInRange.size;

		return {
			newPatients,
			returningPatients,
			activePatients,
		};
	}),

	getPatientAnalytics: protectedProcedure.input(dateRangeSchema).query(async ({ ctx, input }) => {
		const startDate = new Date(input.startDate);
		const endDate = new Date(input.endDate);
		endDate.setHours(23, 59, 59, 999);

		const visitsInRange = await db
			.select({
				id: visit.id,
				patientId: visit.patientId,
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

		if (visitsInRange.length === 0) {
			return {
				genderDistribution: {
					M: 0,
					F: 0,
				},
				visitsByWeekday: Array.from({ length: 7 }, (_, dayIndex) => ({
					dayIndex,
					count: 0,
				})),
				treatmentsByWeekday: Array.from({ length: 7 }, (_, dayIndex) => ({
					dayIndex,
					count: 0,
				})),
				topPatientsByVisits: [],
				topPatientsByPaid: [],
				topPatientsByDebt: [],
			};
		}

		const visitIds = visitsInRange.map((v) => v.id);
		const patientIds = Array.from(new Set(visitsInRange.map((v) => v.patientId)));

		const patientsData = await db
			.select({
				id: patient.id,
				name: patient.name,
				sex: patient.sex,
			})
			.from(patient)
			.where(and(eq(patient.userId, ctx.session.user.id), inArray(patient.id, patientIds)));

		const actsByVisit = await db
			.select({
				visitId: visitAct.visitId,
				price: visitAct.price,
			})
			.from(visitAct)
			.where(inArray(visitAct.visitId, visitIds));

		const totalsByVisit = new Map<string, number>();

		for (const act of actsByVisit) {
			totalsByVisit.set(act.visitId, (totalsByVisit.get(act.visitId) ?? 0) + act.price);
		}

		const paymentsByVisitRows = await db
			.select({
				visitId: payment.visitId,
				amount: payment.amount,
			})
			.from(payment)
			.where(and(inArray(payment.visitId, visitIds), lte(payment.recordedAt, endDate)));

		const paidByVisit = new Map<string, number>();

		for (const paymentRow of paymentsByVisitRows) {
			paidByVisit.set(
				paymentRow.visitId,
				(paidByVisit.get(paymentRow.visitId) ?? 0) + paymentRow.amount,
			);
		}

		const genderDistribution = {
			M: 0,
			F: 0,
		};

		for (const patientRecord of patientsData) {
			if (patientRecord.sex === "M") {
				genderDistribution.M += 1;
			} else if (patientRecord.sex === "F") {
				genderDistribution.F += 1;
			}
		}

		const weekdayCounts = Array.from({ length: 7 }, (_, dayIndex) => ({ dayIndex, count: 0 }));
		const treatmentWeekdayCounts = Array.from({ length: 7 }, (_, dayIndex) => ({
			dayIndex,
			count: 0,
		}));

		const actsByVisitId = new Map<string, number>();
		for (const act of actsByVisit) {
			actsByVisitId.set(act.visitId, (actsByVisitId.get(act.visitId) ?? 0) + 1);
		}

		const patientAggregate = new Map<
			string,
			{ patientId: string; name: string; visits: number; paid: number; debt: number }
		>();

		const patientNameById = new Map(patientsData.map((p) => [p.id, p.name]));

		for (const visitRecord of visitsInRange) {
			const dayIndex = new Date(visitRecord.visitTime).getDay();
			weekdayCounts[dayIndex]!.count += 1;
			treatmentWeekdayCounts[dayIndex]!.count += actsByVisitId.get(visitRecord.id) ?? 0;

			const total = totalsByVisit.get(visitRecord.id) ?? 0;
			const paid = paidByVisit.get(visitRecord.id) ?? 0;
			const debt = Math.max(0, total - paid);

			const existing = patientAggregate.get(visitRecord.patientId) ?? {
				patientId: visitRecord.patientId,
				name: capitalizePatientName(patientNameById.get(visitRecord.patientId) ?? "-"),
				visits: 0,
				paid: 0,
				debt: 0,
			};

			existing.visits += 1;
			existing.paid += paid;
			existing.debt += debt;

			patientAggregate.set(visitRecord.patientId, existing);
		}

		const patientRows = Array.from(patientAggregate.values());

		const topPatientsByVisits = [...patientRows]
			.sort((a, b) => b.visits - a.visits)
			.slice(0, 8)
			.map(({ patientId, name, visits }) => ({ patientId, name, value: visits }));

		const topPatientsByPaid = [...patientRows]
			.sort((a, b) => b.paid - a.paid)
			.slice(0, 8)
			.map(({ patientId, name, paid }) => ({ patientId, name, value: paid }));

		const topPatientsByDebt = [...patientRows]
			.sort((a, b) => b.debt - a.debt)
			.slice(0, 8)
			.map(({ patientId, name, debt }) => ({ patientId, name, value: debt }));

		return {
			genderDistribution,
			visitsByWeekday: weekdayCounts,
			treatmentsByWeekday: treatmentWeekdayCounts,
			topPatientsByVisits,
			topPatientsByPaid,
			topPatientsByDebt,
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

		if (visitIds.length > 0) {
			const actsData = await db
				.select({
					visitTypeId: visitType.id,
					visitTypeName: visitType.name,
				})
				.from(visitAct)
				.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
				.where(eq(visitAct.visitId, visitIds[0]!));

			for (let i = 1; i < visitIds.length; i++) {
				const moreActs = await db
					.select({
						visitTypeId: visitType.id,
						visitTypeName: visitType.name,
					})
					.from(visitAct)
					.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
					.where(eq(visitAct.visitId, visitIds[i]!));
				actsData.push(...moreActs);
			}

			const treatmentCounts: Record<string, { count: number; visitTypeId: string }> = {};

			for (const act of actsData) {
				if (!treatmentCounts[act.visitTypeName]) {
					treatmentCounts[act.visitTypeName] = { count: 0, visitTypeId: act.visitTypeId };
				}
				treatmentCounts[act.visitTypeName]!.count++;
			}

			const topTreatments = Object.entries(treatmentCounts)
				.map(([treatment, data]) => ({ treatment, count: data.count, visitTypeId: data.visitTypeId }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			return {
				topTreatments,
			};
		}

		return {
			topTreatments: [],
		};
	}),
});
