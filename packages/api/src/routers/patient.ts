import { db } from "@offline-sqlite/db";
import {
	appointment,
	visit,
	visitAct,
	visitActTooth,
	patient,
	visitType,
} from "@offline-sqlite/db/schema/dental";
import { eq, and, like, desc, sql, asc, gte } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";
import { getVisitTotalPaid } from "../utils/payment";
import { ageFromDateOfBirth, capitalizePatientName, dateOfBirthFromAge } from "../utils/patient";

const generateId = () => crypto.randomUUID();

const sexEnum = z.enum(["M", "F"]);
const patientSortEnum = z.enum(["lastVisitDesc", "nameAsc", "nameDesc", "unpaidDesc"]);

const patientFilterSchema = z.object({
	sex: sexEnum.optional(),
	dateFrom: z.number().optional(),
	dateTo: z.number().optional(),
	visitTypeIds: z.array(z.string()).optional(),
	hasUnpaid: z.boolean().optional(),
	hasUpcomingAppointment: z.boolean().optional(),
	name: z.string().optional(),
	query: z.string().optional(),
	sortBy: patientSortEnum.optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(10),
});

const patientCreateSchema = z.object({
	name: z.string().min(1),
	sex: sexEnum,
	age: z.number().int().min(0).max(150).optional(),
	dateOfBirth: z.number().optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	medicalNotes: z.string().optional(),
});

const patientUpdateSchema = patientCreateSchema.partial().extend({
	id: z.string(),
});

export const patientRouter = router({
	list: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select()
			.from(patient)
			.where(eq(patient.userId, ctx.session.user.id))
			.orderBy(desc(patient.createdAt));

		return rows.map((row) => ({
			...row,
			name: capitalizePatientName(row.name),
		}));
	}),

	search: protectedProcedure
		.input(
			z.object({
				query: z.string().min(1),
			}),
		)
		.query(async ({ ctx, input }) => {
			const rows = await db
				.select()
				.from(patient)
				.where(and(eq(patient.userId, ctx.session.user.id), like(patient.name, `%${input.query}%`)))
				.limit(20);

			return rows.map((row) => ({
				...row,
				name: capitalizePatientName(row.name),
			}));
		}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select()
			.from(patient)
			.where(and(eq(patient.id, input.id), eq(patient.userId, ctx.session.user.id)))
			.limit(1);

		if (!result[0]) {
			return null;
		}

		return {
			...result[0],
			name: capitalizePatientName(result[0].name),
		};
	}),

	create: protectedProcedure.input(patientCreateSchema).mutation(async ({ ctx, input }) => {
		const id = generateId();
		const hasAge = input.age !== undefined;
		const hasDateOfBirth = input.dateOfBirth !== undefined;

		let calculatedAge = input.age;
		let calculatedDateOfBirth = input.dateOfBirth;

		if (!hasAge && hasDateOfBirth && input.dateOfBirth) {
			calculatedAge = ageFromDateOfBirth(input.dateOfBirth);
		}

		if (hasAge && !hasDateOfBirth && input.age !== undefined) {
			calculatedDateOfBirth = dateOfBirthFromAge(input.age).getTime();
		}

		await db.insert(patient).values({
			id,
			name: capitalizePatientName(input.name),
			sex: input.sex,
			age: calculatedAge ?? null,
			dateOfBirth: calculatedDateOfBirth ? new Date(calculatedDateOfBirth) : null,
			phone: input.phone ?? null,
			address: input.address ?? null,
			medicalNotes: input.medicalNotes ?? null,
			userId: ctx.session.user.id,
		});
		return { id };
	}),

	update: protectedProcedure.input(patientUpdateSchema).mutation(async ({ ctx, input }) => {
		const { id, name, dateOfBirth, ...data } = input;

		const updateData: Record<string, unknown> = { ...data };

		if (name !== undefined) {
			updateData.name = capitalizePatientName(name);
		}

		const hasAge = data.age !== undefined;
		const hasDateOfBirth = dateOfBirth !== undefined;

		if (dateOfBirth !== undefined) {
			updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

			if (!hasAge && dateOfBirth) {
				updateData.age = ageFromDateOfBirth(dateOfBirth);
			}
		}

		if (hasAge && !hasDateOfBirth && data.age !== undefined) {
			updateData.dateOfBirth = dateOfBirthFromAge(data.age);
		}

		if (dateOfBirth === null) {
			updateData.dateOfBirth = null;
		}

		await db
			.update(patient)
			.set(updateData)
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
		const now = new Date();

		const visitsData = await Promise.all(
			patients.map(async (p) => {
				const normalizedPatient = {
					...p,
					name: capitalizePatientName(p.name),
				};

				const upcomingAppointment = await db
					.select({
						id: appointment.id,
						scheduledTime: appointment.scheduledTime,
						status: appointment.status,
					})
					.from(appointment)
					.where(
						and(
							eq(appointment.patientId, p.id),
							eq(appointment.userId, ctx.session.user.id),
							eq(appointment.status, "scheduled"),
							gte(appointment.scheduledTime, now),
						),
					)
					.orderBy(asc(appointment.scheduledTime))
					.limit(1);

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
					return {
						patient: normalizedPatient,
						lastVisit: null,
						visits: [],
						totalUnpaid: 0,
						upcomingAppointment: upcomingAppointment[0] ?? null,
					};
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
							amountLeft: Math.max(0, totalAmount - totalPaid),
							acts: acts.map((a) => ({
								...a.act,
								visitType: a.visitType,
								teeth: JSON.parse(a.teeth) as string[],
							})),
						};
					}),
				);

				const totalUnpaid = visitsWithActs.reduce((sum, v) => sum + Math.max(0, v.amountLeft), 0);

				return {
					patient: normalizedPatient,
					lastVisit: visitsWithActs[0],
					visits: visitsWithActs,
					totalUnpaid,
					upcomingAppointment: upcomingAppointment[0] ?? null,
				};
			}),
		);

		let filtered = visitsData;

		const textQuery = input.query ?? input.name;

		if (textQuery) {
			const lowered = textQuery.toLowerCase();
			filtered = filtered.filter(
				(v) =>
					v.patient.name.toLowerCase().includes(lowered) ||
					(v.patient.phone?.toLowerCase().includes(lowered) ?? false) ||
					(v.patient.address?.toLowerCase().includes(lowered) ?? false) ||
					v.patient.medicalNotes?.toLowerCase().includes(lowered) ||
					v.visits.some((visit) =>
						visit.acts.some((act) => act.notes?.toLowerCase().includes(lowered) ?? false),
					),
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

		if (input.visitTypeIds !== undefined && input.visitTypeIds.length > 0) {
			const selectedVisitTypeIds = new Set(input.visitTypeIds);

			filtered = filtered.filter((v) =>
				v.visits.some((visit) => visit.acts.some((act) => selectedVisitTypeIds.has(act.visitTypeId))),
			);
		}

		if (input.hasUnpaid === true) {
			filtered = filtered.filter((v) => v.totalUnpaid > 0);
		}

		if (input.hasUpcomingAppointment === true) {
			filtered = filtered.filter((v) => v.upcomingAppointment !== null);
		}

		const sortBy = input.sortBy ?? "lastVisitDesc";

		filtered.sort((a, b) => {
			if (sortBy === "nameAsc") {
				return a.patient.name.localeCompare(b.patient.name);
			}

			if (sortBy === "nameDesc") {
				return b.patient.name.localeCompare(a.patient.name);
			}

			if (sortBy === "unpaidDesc") {
				return b.totalUnpaid - a.totalUnpaid;
			}

			if (a.lastVisit === null || a.lastVisit === undefined) return 1;
			if (b.lastVisit === null || b.lastVisit === undefined) return -1;
			return b.lastVisit.visitTime - a.lastVisit.visitTime;
		});

		const total = filtered.length;
		const start = (input.page - 1) * input.pageSize;
		const items = filtered.slice(start, start + input.pageSize);
		const totalPages = Math.max(1, Math.ceil(total / input.pageSize));

		return {
			items,
			total,
			page: input.page,
			pageSize: input.pageSize,
			totalPages,
		};
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
			const normalizedPatient = {
				...p,
				name: capitalizePatientName(p.name),
			};

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
						amountLeft: Math.max(0, totalAmount - totalPaid),
						acts: acts.map((a) => ({
							...a.act,
							visitType: a.visitType,
							teeth: JSON.parse(a.teeth) as string[],
						})),
					};
				}),
			);

			const totalUnpaid = visitsWithActs.reduce((sum, v) => sum + Math.max(0, v.amountLeft), 0);

			const appointments = await db
				.select({
					id: appointment.id,
					scheduledTime: appointment.scheduledTime,
					duration: appointment.duration,
					status: appointment.status,
					notes: appointment.notes,
					visitId: appointment.visitId,
					visitType: {
						id: visitType.id,
						name: visitType.name,
					},
				})
				.from(appointment)
				.leftJoin(visitType, eq(appointment.visitTypeId, visitType.id))
				.where(and(eq(appointment.patientId, p.id), eq(appointment.userId, ctx.session.user.id)))
				.orderBy(desc(appointment.scheduledTime));

			return {
				patient: normalizedPatient,
				visits: visitsWithActs,
				totalUnpaid,
				appointments,
			};
		}),
});
