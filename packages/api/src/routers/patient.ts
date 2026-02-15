import { db } from "@offline-sqlite/db";
import { visit, visitAct, visitActTooth, patient, visitType } from "@offline-sqlite/db/schema/dental";
import { eq, and, like, desc, sql } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";
import { getVisitTotalPaid } from "../utils/payment";

const generateId = () => crypto.randomUUID();

const sexEnum = z.enum(["M", "F"]);

const patientFilterSchema = z.object({
	sex: sexEnum.optional(),
	dateFrom: z.number().optional(),
	dateTo: z.number().optional(),
	visitTypeId: z.string().optional(),
	hasUnpaid: z.boolean().optional(),
	name: z.string().optional(),
});

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

	listWithFilters: protectedProcedure.input(patientFilterSchema).query(async ({ ctx, input }) => {
		const patients = await db.select().from(patient).where(eq(patient.userId, ctx.session.user.id));

		const visitsData = await Promise.all(
			patients.map(async (p) => {
				const visitsForPatient = await db
					.select()
					.from(visit)
					.where(
						and(
							eq(visit.patientId, p.id),
							eq(visit.userId, ctx.session.user.id),
							eq(visit.isDeleted, false),
						),
					)
					.orderBy(desc(visit.visitTime));

				if (visitsForPatient.length === 0) {
					return { patient: p, lastVisit: null, visits: [], totalUnpaid: 0 };
				}

				const visitsWithActs = await Promise.all(
					visitsForPatient.map(async (v) => {
						const acts = await db
							.select({
								act: visitAct,
								visitType: visitType,
								teeth: sql<string>`json_group_array(${visitActTooth.toothId})`,
							})
							.from(visitAct)
							.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
							.leftJoin(visitActTooth, eq(visitAct.id, visitActTooth.visitActId))
							.where(eq(visitAct.visitId, v.id))
							.groupBy(visitAct.id);

						const totalAmount = acts.reduce((sum, a) => sum + a.act.price, 0);
						const totalPaid = await getVisitTotalPaid(v.id);

						return {
							...v,
							totalAmount,
							amountPaid: totalPaid,
							amountLeft: totalAmount - totalPaid,
							acts: acts.map((a) => ({
								...a.act,
								visitType: a.visitType,
								teeth: JSON.parse(a.teeth) as string[],
							})),
						};
					}),
				);

				const totalUnpaid = visitsWithActs.reduce((sum, v) => sum + v.amountLeft, 0);

				return {
					patient: p,
					lastVisit: visitsWithActs[0],
					visits: visitsWithActs,
					totalUnpaid,
				};
			}),
		);

		let filtered = visitsData.filter((v) => v.lastVisit !== null);

		if (input.name) {
			filtered = filtered.filter((v) =>
				v.patient.name.toLowerCase().includes(input.name!.toLowerCase()),
			);
		}

		if (input.sex) {
			filtered = filtered.filter((v) => v.patient.sex === input.sex);
		}

		if (input.dateFrom !== undefined) {
			filtered = filtered.filter(
				(v) => v.lastVisit !== null && v.lastVisit!.visitTime >= input.dateFrom!,
			);
		}

		if (input.dateTo !== undefined) {
			filtered = filtered.filter(
				(v) => v.lastVisit !== null && v.lastVisit!.visitTime <= input.dateTo!,
			);
		}

		if (input.visitTypeId !== undefined) {
			filtered = filtered.filter((v) =>
				v.visits.some((visit) => visit.acts.some((act) => act.visitTypeId === input.visitTypeId)),
			);
		}

		if (input.hasUnpaid === true) {
			filtered = filtered.filter((v) => v.totalUnpaid > 0);
		}

		filtered.sort((a, b) => {
			if (a.lastVisit === null || a.lastVisit === undefined) return 1;
			if (b.lastVisit === null || b.lastVisit === undefined) return -1;
			return b.lastVisit.visitTime - a.lastVisit.visitTime;
		});

		return filtered;
	}),

	getByIdWithVisits: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const result = await db
				.select()
				.from(patient)
				.where(and(eq(patient.id, input.id), eq(patient.userId, ctx.session.user.id)))
				.limit(1);

			if (result.length === 0 || result[0] === undefined) {
				return null;
			}

			const p = result[0];

			const visitsForPatient = await db
				.select()
				.from(visit)
				.where(
					and(
						eq(visit.patientId, p.id),
						eq(visit.userId, ctx.session.user.id),
						eq(visit.isDeleted, false),
					),
				)
				.orderBy(desc(visit.visitTime));

			const visitsWithActs = await Promise.all(
				visitsForPatient.map(async (v) => {
					const acts = await db
						.select({
							act: visitAct,
							visitType: visitType,
							teeth: sql<string>`json_group_array(${visitActTooth.toothId})`,
						})
						.from(visitAct)
						.innerJoin(visitType, eq(visitAct.visitTypeId, visitType.id))
						.leftJoin(visitActTooth, eq(visitAct.id, visitActTooth.visitActId))
						.where(eq(visitAct.visitId, v.id))
						.groupBy(visitAct.id);

					const totalAmount = acts.reduce((sum, a) => sum + a.act.price, 0);
					const totalPaid = await getVisitTotalPaid(v.id);

					return {
						...v,
						totalAmount,
						amountPaid: totalPaid,
						amountLeft: totalAmount - totalPaid,
						acts: acts.map((a) => ({
							...a.act,
							visitType: a.visitType,
							teeth: JSON.parse(a.teeth) as string[],
						})),
					};
				}),
			);

			const totalUnpaid = visitsWithActs.reduce((sum, v) => sum + v.amountLeft, 0);

			return {
				patient: p,
				visits: visitsWithActs,
				totalUnpaid,
			};
		}),
});
