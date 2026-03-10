import z from "zod";

export function createAppointmentFormSchema(t: (key: string) => string) {
	return z.object({
		patientId: z.string(),
		scheduledTime: z.date().refine((value) => !Number.isNaN(value.getTime()), {
			message: t("appointments.validation.scheduledTimeRequired"),
		}),
		duration: z.number().int().min(1, t("appointments.validation.durationRequired")),
		visitTypeId: z.string().min(1, t("appointments.validation.visitTypeRequired")),
		notes: z.string(),
		status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
		patient: z.object({
			name: z.string().trim().min(2, t("patients.validation.nameMin")),
			sex: z.enum(["M", "F"]),
			age: z.union([
				z
					.number()
					.int()
					.min(0, t("patients.validation.ageMin"))
					.max(150, t("patients.validation.ageMax")),
				z.literal(""),
			]),
			dateOfBirth: z.string(),
			phone: z.string(),
			address: z.string(),
			medicalNotes: z.string(),
		}),
	});
}
