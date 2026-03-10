import z from "zod";

export function createPatientEditSchema(t: (key: string) => string) {
	return z.object({
		name: z.string().trim().min(2, t("patients.validation.nameMin")),
		sex: z.enum(["M", "F"]),
		age: z
			.union([
				z.literal(""),
				z
					.number()
					.int()
					.min(0, t("patients.validation.ageMin"))
					.max(150, t("patients.validation.ageMax")),
			])
			.refine((value) => value !== "", {
				message: t("patients.validation.ageRequired"),
			}),
		dateOfBirth: z
			.string()
			.refine(
				(value) => !value || !Number.isNaN(new Date(value).getTime()),
				t("patients.validation.dateOfBirthInvalid"),
			),
		phone: z.string(),
		address: z.string(),
		medicalNotes: z.string(),
	});
}
