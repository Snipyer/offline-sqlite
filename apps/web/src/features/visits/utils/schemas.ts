import z from "zod";

export function createVisitFormSchema(t: (key: string) => string) {
	return z.object({
		patientId: z.string().min(1, t("visits.validation.patientRequired")),
		visitTime: z.date(),
		acts: z
			.array(
				z.object({
					id: z.string(),
					visitTypeId: z.string().min(1, t("visits.validation.procedureTypeRequired")),
					price: z.number().int().min(1, t("visits.validation.priceMin")),
					teeth: z.array(z.string()).min(1, t("visits.validation.toothRequired")),
					notes: z.string().optional(),
				}),
			)
			.min(1, t("visits.validation.actRequired")),
	});
}
