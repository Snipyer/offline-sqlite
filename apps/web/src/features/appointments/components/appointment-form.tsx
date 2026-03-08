import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Loader2, Plus, Search, User, Calendar as CalendarIcon, Clock, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import { toast } from "sonner";

interface Patient {
	id: string;
	name: string;
	sex: "M" | "F";
	age: number | null;
	dateOfBirth: string | null;
	phone: string | null;
	address: string | null;
	medicalNotes: string | null;
}

interface VisitType {
	id: string;
	name: string;
}

interface Appointment {
	id: string;
	patientId: string;
	scheduledTime: Date | string;
	duration: number;
	status: "scheduled" | "completed" | "cancelled" | "no-show";
	visitId: string | null;
	visitTypeId: string | null;
	notes: string | null;
	patient: Patient;
	visitType: VisitType | null;
}

interface AppointmentFormProps {
	appointment?: Appointment | null;
	prefillTime?: number | null;
	selectedDate: Date;
	onSuccess: () => void;
	onCancel: () => void;
}

type Sex = "M" | "F";
type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

interface PatientFormData {
	name: string;
	sex: Sex;
	age: number | "";
	dateOfBirth: string;
	phone: string;
	address: string;
	medicalNotes: string;
}

interface AppointmentFormValues {
	patientId: string;
	scheduledTime: string;
	duration: number;
	visitTypeId: string;
	notes: string;
	status: AppointmentStatus;
	patient: PatientFormData;
}

function toLocalDateTimeInputValue(value: Date | string | number) {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day}T${hours}:${minutes}`;
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

const emptyPatientData: PatientFormData = {
	name: "",
	sex: "M",
	age: "",
	dateOfBirth: "",
	phone: "",
	address: "",
	medicalNotes: "",
};

export function AppointmentForm({
	appointment,
	prefillTime,
	selectedDate,
	onSuccess,
	onCancel,
}: AppointmentFormProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const isEditMode = !!appointment;
	const [patientSearch, setPatientSearch] = useState("");
	const [showPatientResults, setShowPatientResults] = useState(false);

	const initialScheduledTime = prefillTime
		? toLocalDateTimeInputValue(prefillTime)
		: appointment
			? toLocalDateTimeInputValue(appointment.scheduledTime)
			: toLocalDateTimeInputValue(selectedDate);

	const form = useForm({
		defaultValues: {
			patientId: appointment?.patientId || "",
			scheduledTime: initialScheduledTime,
			duration: appointment?.duration || 30,
			visitTypeId: appointment?.visitTypeId || "",
			notes: appointment?.notes || "",
			status: (appointment?.status || "scheduled") as AppointmentStatus,
			patient: appointment?.patient
				? {
						name: appointment.patient.name,
						sex: appointment.patient.sex,
						age: appointment.patient.age ?? "",
						dateOfBirth: appointment.patient.dateOfBirth
							? new Date(appointment.patient.dateOfBirth).toISOString().split("T")[0]
							: "",
						phone: appointment.patient.phone || "",
						address: appointment.patient.address || "",
						medicalNotes: appointment.patient.medicalNotes || "",
					}
				: emptyPatientData,
		} satisfies AppointmentFormValues,
		onSubmit: async ({ value }) => {
			await handleFormSubmit(value);
		},
	});

	const patients = useQuery({
		...trpc.patient.search.queryOptions({ query: patientSearch }),
		enabled: patientSearch.length > 0,
	});

	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const createPatientMutation = useMutation(
		trpc.patient.create.mutationOptions({
			onError: (error: { message: string }) => {
				toast.error(error.message);
			},
		}),
	);

	const createMutation = useMutation(
		trpc.appointment.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["appointment"] });
				onSuccess();
			},
		}),
	);

	const updateMutation = useMutation(
		trpc.appointment.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["appointment"] });
				onSuccess();
			},
		}),
	);

	useEffect(() => {
		if (appointment?.patient) {
			form.setFieldValue("patientId", appointment.patientId);
			form.setFieldValue("scheduledTime", toLocalDateTimeInputValue(appointment.scheduledTime));
			form.setFieldValue("duration", appointment.duration);
			form.setFieldValue("visitTypeId", appointment.visitTypeId || "");
			form.setFieldValue("notes", appointment.notes || "");
			form.setFieldValue("status", appointment.status);
			form.setFieldValue("patient", {
				name: appointment.patient.name,
				sex: appointment.patient.sex,
				age: appointment.patient.age ?? "",
				dateOfBirth: appointment.patient.dateOfBirth
					? new Date(appointment.patient.dateOfBirth).toISOString().split("T")[0]
					: "",
				phone: appointment.patient.phone || "",
				address: appointment.patient.address || "",
				medicalNotes: appointment.patient.medicalNotes || "",
			});
			setPatientSearch(appointment.patient.name);
		} else {
			const nextScheduledTime = prefillTime
				? toLocalDateTimeInputValue(prefillTime)
				: toLocalDateTimeInputValue(selectedDate);
			form.setFieldValue("patientId", "");
			form.setFieldValue("scheduledTime", nextScheduledTime);
			form.setFieldValue("duration", 30);
			form.setFieldValue("visitTypeId", "");
			form.setFieldValue("notes", "");
			form.setFieldValue("status", "scheduled");
			form.setFieldValue("patient", emptyPatientData);
			setPatientSearch("");
		}
	}, [appointment, prefillTime, selectedDate, form]);

	const handlePatientSelect = (patient: Patient) => {
		form.setFieldValue("patient", {
			name: patient.name,
			sex: patient.sex,
			age: patient.age ?? "",
			dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split("T")[0] : "",
			phone: patient.phone || "",
			address: patient.address || "",
			medicalNotes: patient.medicalNotes || "",
		});
		setPatientSearch(patient.name);
		form.setFieldValue("patientId", patient.id);
		setShowPatientResults(false);
	};

	const handleCreateNewPatient = () => {
		form.setFieldValue("patient", emptyPatientData);
		setPatientSearch("");
		form.setFieldValue("patientId", "");
		setShowPatientResults(false);
	};

	const handleClearPatient = () => {
		form.setFieldValue("patient", emptyPatientData);
		setPatientSearch("");
		form.setFieldValue("patientId", "");
	};

	const handleFormSubmit = async (values: AppointmentFormValues) => {
		let finalPatientId = values.patientId;

		if (!isEditMode && (!finalPatientId || finalPatientId === "new")) {
			if (!values.patient.name.trim()) {
				toast.error(t("patients.nameRequired"));
				return;
			}
			const result = await createPatientMutation.mutateAsync({
				name: values.patient.name.trim(),
				sex: values.patient.sex,
				age: Number(values.patient.age) || 0,
				dateOfBirth: values.patient.dateOfBirth
					? new Date(values.patient.dateOfBirth).getTime()
					: undefined,
				phone: values.patient.phone || undefined,
				address: values.patient.address || undefined,
				medicalNotes: values.patient.medicalNotes || undefined,
			});
			finalPatientId = result.id;
			form.setFieldValue("patientId", result.id);
		}

		const scheduledTimeNum = new Date(values.scheduledTime).getTime();

		if (isEditMode && appointment) {
			await updateMutation.mutateAsync({
				id: appointment.id,
				scheduledTime: scheduledTimeNum,
				duration: values.duration,
				visitTypeId: values.visitTypeId || undefined,
				notes: values.notes || undefined,
				status: values.status,
			});
		} else {
			await createMutation.mutateAsync({
				patientId: finalPatientId,
				scheduledTime: scheduledTimeNum,
				duration: values.duration,
				visitTypeId: values.visitTypeId || undefined,
				notes: values.notes || undefined,
			});
		}
	};

	const isLoading = createMutation.isPending || updateMutation.isPending || createPatientMutation.isPending;
	const hasSelectedPatient = form.getFieldValue("patientId") !== "";
	const statusLabelMap: Record<AppointmentStatus, string> = {
		scheduled: t("appointments.statuses.scheduled"),
		completed: t("appointments.statuses.completed"),
		cancelled: t("appointments.statuses.cancelled"),
		"no-show": t("appointments.statuses.noShow"),
	};

	return (
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
					<div className="flex items-center gap-3">
						<div
							className="bg-primary text-primary-foreground flex h-8 w-8 items-center
								justify-center rounded-full text-sm font-semibold"
						>
							1
						</div>
						<CardTitle className="text-lg">{t("appointments.patient")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 py-4">
					{!isEditMode && !hasSelectedPatient && (
						<div className="relative">
							<Label className="mb-2 block text-sm font-medium">
								{t("visits.searchExistingOrNew")}
							</Label>
							<div className="relative">
								<Search
									className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4
										-translate-y-1/2"
								/>
								<Input
									placeholder={t("patients.searchPlaceholder")}
									value={patientSearch}
									onChange={(e) => {
										setPatientSearch(e.target.value);
										setShowPatientResults(true);
									}}
									onFocus={() => setShowPatientResults(true)}
									className="pl-10"
								/>
							</div>

							{showPatientResults && patientSearch.length > 0 && (
								<div
									className="bg-background absolute z-10 mt-1 w-full rounded-md border
										shadow-lg"
								>
									{patients.isLoading && (
										<div className="flex items-center justify-center p-4">
											<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
										</div>
									)}
									{!patients.isLoading && patients.data?.length === 0 && (
										<div className="text-muted-foreground px-4 py-3 text-sm">
											{t("visits.noPatientsFound")}
										</div>
									)}
									{patients.data?.map((patient) => (
										<button
											key={patient.id}
											type="button"
											className="hover:bg-muted flex w-full items-center gap-3 px-4 py-3
												text-left transition-colors"
											onClick={() => handlePatientSelect(patient)}
										>
											<div
												className="bg-primary/10 flex h-8 w-8 items-center
													justify-center rounded-full"
											>
												<User className="text-primary h-4 w-4" />
											</div>
											<div>
												<p className="font-medium">{patient.name}</p>
												<p className="text-muted-foreground text-sm">
													{patient.age} {t("patients.years")} •{" "}
													{patient.sex === "M"
														? t("patients.sexMale")
														: t("patients.sexFemale")}
													{patient.phone && ` • ${patient.phone}`}
												</p>
											</div>
										</button>
									))}
									<button
										type="button"
										className="text-primary hover:bg-muted flex w-full items-center gap-3
											border-t px-4 py-3 text-left transition-colors"
										onClick={handleCreateNewPatient}
									>
										<div
											className="bg-primary/10 flex h-8 w-8 items-center justify-center
												rounded-full"
										>
											<Plus className="h-4 w-4" />
										</div>
										<span className="font-medium">{t("visits.createNewPatient")}</span>
									</button>
								</div>
							)}
						</div>
					)}

					<div className="bg-card rounded-lg border p-4">
						<div className="mb-4 flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div
									className="bg-primary/10 flex h-10 w-10 items-center justify-center
										rounded-full"
								>
									<User className="text-primary h-5 w-5" />
								</div>
								<div>
									<p className="font-semibold">
										{form.getFieldValue("patient.name") ||
											t("visits.selectOrCreatePatient")}
									</p>
									{form.getFieldValue("patient.name") && (
										<p className="text-muted-foreground text-sm">
											{form.getFieldValue("patient.age") || "0"} {t("patients.years")} •{" "}
											{form.getFieldValue("patient.sex") === "M"
												? t("patients.sexMale")
												: t("patients.sexFemale")}
											{form.getFieldValue("patient.phone") &&
												` • ${form.getFieldValue("patient.phone")}`}
										</p>
									)}
								</div>
							</div>
							{!isEditMode && hasSelectedPatient && (
								<Button type="button" variant="ghost" size="sm" onClick={handleClearPatient}>
									{t("visits.change")}
								</Button>
							)}
						</div>

						<div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<Label htmlFor="patient-name">{t("patients.nameLabel")} *</Label>
								<form.Field name="patient.name">
									{(field) => (
										<Input
											id="patient-name"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t("patients.namePlaceholder")}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
										/>
									)}
								</form.Field>
							</div>
							<div>
								<Label htmlFor="patient-sex">{t("patients.sexLabel")} *</Label>
								<form.Field name="patient.sex">
									{(field) => (
										<Select
											value={field.state.value}
											onValueChange={(value) => field.handleChange(value as Sex)}
											disabled={isEditMode || hasSelectedPatient}
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
								<Label htmlFor="patient-age">{t("patients.ageLabel")} *</Label>
								<form.Field name="patient.age">
									{(field) => (
										<Input
											id="patient-age"
											type="number"
											min={0}
											max={150}
											value={field.state.value || ""}
											placeholder="0"
											onChange={(e) =>
												field.handleChange(
													e.target.value ? parseInt(e.target.value) : "",
												)
											}
											onBlur={() => {
												const currentAge = form.getFieldValue("patient.age");
												if (typeof currentAge === "number") {
													form.setFieldValue(
														"patient.dateOfBirth",
														calculateDateOfBirthFromAge(currentAge),
													);
												}
											}}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
										/>
									)}
								</form.Field>
							</div>
							<div>
								<Label htmlFor="patient-dob">{t("patients.dateOfBirth")}</Label>
								<form.Field name="patient.dateOfBirth">
									{(field) => (
										<Input
											id="patient-dob"
											type="date"
											value={field.state.value}
											onChange={(e) => {
												const nextDob = e.target.value;
												field.handleChange(nextDob);
												form.setFieldValue(
													"patient.age",
													nextDob ? calculateAge(nextDob) : "",
												);
											}}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
										/>
									)}
								</form.Field>
							</div>
							<div>
								<Label htmlFor="patient-phone">{t("patients.phoneLabel")}</Label>
								<form.Field name="patient.phone">
									{(field) => (
										<Input
											id="patient-phone"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t("patients.phonePlaceholder")}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
										/>
									)}
								</form.Field>
							</div>
							<div>
								<Label htmlFor="patient-address">{t("patients.addressLabel")}</Label>
								<form.Field name="patient.address">
									{(field) => (
										<Input
											id="patient-address"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t("patients.addressPlaceholder")}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
										/>
									)}
								</form.Field>
							</div>
							<div className="sm:col-span-2">
								<Label htmlFor="patient-medical-notes">{t("patients.medicalNotes")}</Label>
								<form.Field name="patient.medicalNotes">
									{(field) => (
										<Textarea
											id="patient-medical-notes"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder={t("patients.medicalNotesPlaceholder")}
											className="mt-1.5"
											disabled={isEditMode || hasSelectedPatient}
											rows={2}
										/>
									)}
								</form.Field>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div
							className="bg-primary text-primary-foreground flex h-8 w-8 items-center
								justify-center rounded-full text-sm font-semibold"
						>
							2
						</div>
						<CardTitle className="text-lg">{t("appointments.title")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-4 py-4">
					<div className="grid gap-4 sm:grid-cols-1">
						<div>
							<Label htmlFor="scheduledTime">{t("appointments.scheduledTime")} *</Label>
							<div className="relative mt-1.5">
								<CalendarIcon
									className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4
										-translate-y-1/2"
								/>
								<form.Field name="scheduledTime">
									{(field) => (
										<Input
											id="scheduledTime"
											type="datetime-local"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											className="pl-10"
										/>
									)}
								</form.Field>
							</div>
						</div>

						<div>
							<Label htmlFor="duration">{t("appointments.duration")} *</Label>
							<form.Field name="duration">
								{(field) => (
									<Select
										value={field.state.value.toString()}
										onValueChange={(v) => field.handleChange(parseInt(v || "30"))}
									>
										<SelectTrigger id="duration" className="mt-1.5 w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="15">15 {t("appointments.minutes")}</SelectItem>
											<SelectItem value="30">30 {t("appointments.minutes")}</SelectItem>
											<SelectItem value="45">45 {t("appointments.minutes")}</SelectItem>
											<SelectItem value="60">60 {t("appointments.minutes")}</SelectItem>
											<SelectItem value="90">90 {t("appointments.minutes")}</SelectItem>
											<SelectItem value="120">
												120 {t("appointments.minutes")}
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							</form.Field>
						</div>

						<div>
							<Label htmlFor="visitType">{t("appointments.visitType")}</Label>
							<form.Field name="visitTypeId">
								{(field) => (
									<Select
										value={field.state.value || "none"}
										onValueChange={(v) => field.handleChange(v === "none" ? "" : v || "")}
									>
										<SelectTrigger id="visitType" className="mt-1.5 w-full">
											<SelectValue placeholder={t("common.select")}>
												{field.state.value && visitTypes.data
													? visitTypes.data.find(
															(vt) => vt.id === field.state.value,
														)?.name
													: t("common.select")}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">{t("common.select")}</SelectItem>
											{visitTypes.data?.map((vt) => (
												<SelectItem key={vt.id} value={vt.id}>
													{vt.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</form.Field>
						</div>

						{isEditMode && (
							<div>
								<Label htmlFor="status">{t("appointments.status")}</Label>
								<form.Field name="status">
									{(field) => (
										<Select
											value={field.state.value}
											onValueChange={(v) =>
												field.handleChange((v || "scheduled") as AppointmentStatus)
											}
										>
											<SelectTrigger id="status" className="mt-1.5 w-full">
												<SelectValue>{statusLabelMap[field.state.value]}</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="scheduled">
													{t("appointments.statuses.scheduled")}
												</SelectItem>
												<SelectItem value="completed">
													{t("appointments.statuses.completed")}
												</SelectItem>
												<SelectItem value="cancelled">
													{t("appointments.statuses.cancelled")}
												</SelectItem>
												<SelectItem value="no-show">
													{t("appointments.statuses.noShow")}
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								</form.Field>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-3">
						<div
							className="bg-primary text-primary-foreground flex h-8 w-8 items-center
								justify-center rounded-full text-sm font-semibold"
						>
							3
						</div>
						<CardTitle className="text-lg">{t("appointments.notes")}</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="py-4">
					<div className="relative">
						<FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
						<form.Field name="notes">
							{(field) => (
								<Textarea
									id="notes"
									placeholder={t("appointments.notesPlaceholder")}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									rows={4}
									className="pl-10"
								/>
							)}
						</form.Field>
					</div>
				</CardContent>
			</Card>

			<div
				className="bg-background/95 supports-backdrop-filter:bg-background/85 sticky bottom-0 z-20
					flex items-center justify-end gap-2 border-t p-4 backdrop-blur"
			>
				<Button type="button" variant="outline" onClick={onCancel}>
					{t("common.cancel")}
				</Button>
				<form.Subscribe
					selector={(state) => ({
						patientId: state.values.patientId,
						patientName: state.values.patient.name,
						scheduledTime: state.values.scheduledTime,
						isSubmitting: state.isSubmitting,
					})}
				>
					{(subState) => {
						const hasPatientValue =
							subState.patientId !== "" || subState.patientName.trim().length > 0;
						const canSubmit =
							subState.scheduledTime.length > 0 && (isEditMode ? true : hasPatientValue);

						return (
							<Button type="submit" disabled={isLoading || subState.isSubmitting || !canSubmit}>
								{isLoading || subState.isSubmitting ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Check className="mr-2 h-4 w-4" />
								)}
								{isEditMode ? t("common.save") : t("appointments.create")}
							</Button>
						);
					}}
				</form.Subscribe>
			</div>
		</form>
	);
}
