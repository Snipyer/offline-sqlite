import { db } from "@offline-sqlite/db";
import { appointment, patient, visitType, appointmentStatusEnum } from "@offline-sqlite/db/schema/dental";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import z from "zod";

import { router, protectedProcedure } from "../index";

const generateId = () => crypto.randomUUID();

const createSchema = z.object({
	patientId: z.string().min(1),
	scheduledTime: z.number(),
	duration: z.number().int().min(15).max(240).default(30),
	visitTypeId: z.string().optional(),
	notes: z.string().optional(),
});

const updateSchema = createSchema
	.omit({ patientId: true })
	.partial()
	.extend({ id: z.string() })
	.extend({ status: z.enum(appointmentStatusEnum).optional() });

const listSchema = z.object({
	month: z.number().int().min(1).max(12),
	year: z.number().int().min(2000).max(2100),
});

const getByDateSchema = z.object({
	date: z.number(),
});

function getMonthRange(month: number, year: number) {
	const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
	const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
	return { startOfMonth, endOfMonth };
}

function getDayRange(date: number) {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);
	return { startOfDay, endOfDay };
}

export const appointmentRouter = router({
	list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
		const { startOfMonth, endOfMonth } = getMonthRange(input.month, input.year);

		const appointments = await db
			.select({
				appointment,
				patient: patient,
				visitType: visitType,
			})
			.from(appointment)
			.innerJoin(patient, eq(appointment.patientId, patient.id))
			.leftJoin(visitType, eq(appointment.visitTypeId, visitType.id))
			.where(
				and(
					eq(appointment.userId, ctx.session.user.id),
					gte(appointment.scheduledTime, startOfMonth),
					lte(appointment.scheduledTime, endOfMonth),
				),
			)
			.orderBy(asc(appointment.scheduledTime));

		return appointments.map((row) => ({
			...row.appointment,
			patient: row.patient,
			visitType: row.visitType,
		}));
	}),

	getByDate: protectedProcedure.input(getByDateSchema).query(async ({ ctx, input }) => {
		const { startOfDay, endOfDay } = getDayRange(input.date);

		const appointments = await db
			.select({
				appointment,
				patient: patient,
				visitType: visitType,
			})
			.from(appointment)
			.innerJoin(patient, eq(appointment.patientId, patient.id))
			.leftJoin(visitType, eq(appointment.visitTypeId, visitType.id))
			.where(
				and(
					eq(appointment.userId, ctx.session.user.id),
					gte(appointment.scheduledTime, startOfDay),
					lte(appointment.scheduledTime, endOfDay),
				),
			)
			.orderBy(asc(appointment.scheduledTime));

		return appointments.map((row) => ({
			...row.appointment,
			patient: row.patient,
			visitType: row.visitType,
		}));
	}),

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
		const result = await db
			.select({
				appointment,
				patient: patient,
				visitType: visitType,
			})
			.from(appointment)
			.innerJoin(patient, eq(appointment.patientId, patient.id))
			.leftJoin(visitType, eq(appointment.visitTypeId, visitType.id))
			.where(and(eq(appointment.id, input.id), eq(appointment.userId, ctx.session.user.id)))
			.limit(1);

		if (result.length === 0 || result[0] === undefined) {
			return null;
		}

		return {
			...result[0].appointment,
			patient: result[0].patient,
			visitType: result[0].visitType,
		};
	}),

	create: protectedProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
		const id = generateId();
		await db.insert(appointment).values({
			id,
			patientId: input.patientId,
			scheduledTime: new Date(input.scheduledTime),
			duration: input.duration,
			visitTypeId: input.visitTypeId ?? null,
			notes: input.notes ?? null,
			userId: ctx.session.user.id,
		});
		return { id };
	}),

	update: protectedProcedure.input(updateSchema).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		const existingAppointment = await db
			.select()
			.from(appointment)
			.where(and(eq(appointment.id, id), eq(appointment.userId, ctx.session.user.id)))
			.limit(1);

		if (existingAppointment.length === 0 || existingAppointment[0] === undefined) {
			throw new Error("Appointment not found");
		}

		const updateData: Record<string, unknown> = {};
		if (data.scheduledTime !== undefined) updateData.scheduledTime = new Date(data.scheduledTime);
		if (data.duration !== undefined) updateData.duration = data.duration;
		if (data.visitTypeId !== undefined) updateData.visitTypeId = data.visitTypeId ?? null;
		if (data.notes !== undefined) updateData.notes = data.notes ?? null;
		if (data.status !== undefined) updateData.status = data.status;

		await db
			.update(appointment)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(and(eq(appointment.id, id), eq(appointment.userId, ctx.session.user.id)));

		return { id };
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
		await db
			.delete(appointment)
			.where(and(eq(appointment.id, input.id), eq(appointment.userId, ctx.session.user.id)));

		return { id: input.id };
	}),
});
