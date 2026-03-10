import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import z from "zod";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toFormErrorMessages } from "@/lib/form-error-messages";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { toast } from "sonner";
import { createPatientEditSchema } from "@/features/patients/utils/schemas";

type Sex = "M" | "F";

interface PatientEditFormProps {
	patientId?: string | null;
	onSuccess?: () => void;
	onCancel?: () => void;
	inSheet?: boolean;
}

function calculateAge(dateString: string): number {
	const today = new Date();
	const birthDate = new Date(dateString);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age -= 1;
	}

	return Math.max(0, age);
}

function calculateDateOfBirthFromAge(age: number): string {
	if (!Number.isFinite(age) || age < 0) {
		return "";
	}

	const today = new Date();
	const dob = new Date(today);
	dob.setFullYear(today.getFullYear() - age);

	return dob.toISOString().split("T")[0] ?? "";
}

export default function PatientEditForm({
	patientId,
	onSuccess,
	onCancel,
	inSheet = false,
}: PatientEditFormProps) {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const resolvedPatientId = patientId ?? id;

	const patientEditSchema = createPatientEditSchema(t);
	type PatientEditValues = z.infer<typeof patientEditSchema>;

	const patientQuery = useQuery({
		...trpc.patient.getById.queryOptions({ id: resolvedPatientId! }),
		enabled: !!resolvedPatientId,
	});

	const updatePatientMutation = useMutation(
		trpc.patient.update.mutationOptions({
			onSuccess: () => {
				toast.success(t("common.saved"));
				queryClient.invalidateQueries({
					queryKey: trpc.patient.listWithFilters.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.patient.getByIdWithVisits.queryKey(),
				});
				if (onSuccess) {
					onSuccess();
					return;
				}
				navigate("/patients");
			},
			onError: (error: { message: string }) => {
				toast.error(error.message);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: "",
			sex: "M" as Sex,
			age: "" as number | "",
			dateOfBirth: "",
			phone: "",
			address: "",
			medicalNotes: "",
		},
		onSubmit: async ({ value }) => {
			if (!resolvedPatientId) return;

			await updatePatientMutation.mutateAsync({
				id: resolvedPatientId,
				name: value.name,
				sex: value.sex,
				age: value.age === "" ? undefined : value.age,
				dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth).getTime() : undefined,
				phone: value.phone || undefined,
				address: value.address || undefined,
				medicalNotes: value.medicalNotes || undefined,
			});
		},
		validators: {
			onSubmit: patientEditSchema,
		},
	});

	useEffect(() => {
		const patient = patientQuery.data;
		if (!patient) return;

		form.setFieldValue("name", patient.name);
		form.setFieldValue("sex", patient.sex);
		form.setFieldValue("age", patient.age ?? "");
		form.setFieldValue(
			"dateOfBirth",
			patient.dateOfBirth ? (new Date(patient.dateOfBirth).toISOString().split("T")[0] ?? "") : "",
		);
		form.setFieldValue("phone", patient.phone ?? "");
		form.setFieldValue("address", patient.address ?? "");
		form.setFieldValue("medicalNotes", patient.medicalNotes ?? "");
	}, [patientQuery.data, form]);

	if (patientQuery.isLoading) {
		return <Loader />;
	}

	if (!patientQuery.data) {
		return (
			<div className="container mx-auto py-8">
				<h1>{t("patients.notFound")}</h1>
			</div>
		);
	}

	return (
		<div className={inSheet ? "p-4" : "container mx-auto max-w-3xl px-4 py-8"}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					void form.handleSubmit();
				}}
				className="space-y-6"
			>
				<Card>
					<CardHeader>
						<CardTitle>{t("patients.editPatient")}</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label htmlFor="patient-name">{t("patients.nameLabel")}</Label>
							<form.Field name="name">
								{(field) => (
									<>
										<Input
											id="patient-name"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t("patients.namePlaceholder")}
											className="mt-1.5"
										/>
										{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
											<p
												key={`${error}-${index}`}
												className="text-destructive mt-1 text-xs"
											>
												{error}
											</p>
										))}
									</>
								)}
							</form.Field>
						</div>

						<div>
							<Label htmlFor="patient-sex">{t("patients.sexLabel")}</Label>
							<form.Field name="sex">
								{(field) => (
									<Select
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value as Sex)}
									>
										<SelectTrigger id="patient-sex" className="mt-1.5 w-full">
											<SelectValue placeholder={t("patients.sexLabel")} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="M">{t("patients.sexMale")}</SelectItem>
											<SelectItem value="F">{t("patients.sexFemale")}</SelectItem>
										</SelectContent>
									</Select>
								)}
							</form.Field>
						</div>

						<div>
							<Label htmlFor="patient-age">{t("patients.ageLabel")}</Label>
							<form.Field name="age">
								{(field) => (
									<>
										<Input
											id="patient-age"
											type="number"
											min={0}
											max={150}
											value={field.state.value || ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value ? parseInt(e.target.value) : "",
												)
											}
											onBlur={() => {
												if (typeof field.state.value === "number") {
													form.setFieldValue(
														"dateOfBirth",
														calculateDateOfBirthFromAge(field.state.value),
													);
												}
											}}
											className="mt-1.5"
										/>
										{toFormErrorMessages(field.state.meta.errors).map((error, index) => (
											<p
												key={`${error}-${index}`}
												className="text-destructive mt-1 text-xs"
											>
												{error}
											</p>
										))}
									</>
								)}
							</form.Field>
						</div>

						<div>
							<Label htmlFor="patient-dob">{t("patients.dateOfBirth")}</Label>
							<form.Field name="dateOfBirth">
								{(field) => (
									<Input
										id="patient-dob"
										type="date"
										value={field.state.value}
										onChange={(e) => {
											const nextDob = e.target.value;
											field.handleChange(nextDob);
											form.setFieldValue("age", nextDob ? calculateAge(nextDob) : "");
										}}
										className="mt-1.5"
									/>
								)}
							</form.Field>
						</div>

						<div>
							<Label htmlFor="patient-phone">{t("patients.phoneLabel")}</Label>
							<form.Field name="phone">
								{(field) => (
									<Input
										id="patient-phone"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("patients.phonePlaceholder")}
										className="mt-1.5"
									/>
								)}
							</form.Field>
						</div>

						<div className="sm:col-span-2">
							<Label htmlFor="patient-address">{t("patients.addressLabel")}</Label>
							<form.Field name="address">
								{(field) => (
									<Input
										id="patient-address"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("patients.addressPlaceholder")}
										className="mt-1.5"
									/>
								)}
							</form.Field>
						</div>

						<div className="sm:col-span-2">
							<Label htmlFor="patient-medical-notes">{t("patients.medicalNotes")}</Label>
							<form.Field name="medicalNotes">
								{(field) => (
									<Textarea
										id="patient-medical-notes"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={t("patients.medicalNotesPlaceholder")}
										className="mt-1.5"
										rows={2}
									/>
								)}
							</form.Field>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							if (onCancel) {
								onCancel();
								return;
							}
							navigate("/patients");
						}}
					>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={updatePatientMutation.isPending}>
						{t("common.save")}
					</Button>
				</div>
			</form>
		</div>
	);
}
