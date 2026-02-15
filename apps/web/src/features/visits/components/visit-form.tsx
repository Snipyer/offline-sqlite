import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Check, Search, User, Calendar as CalendarIcon, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToothSelector, ToothBadge } from "@/features/tooth-selector/components/tooth-selector";
import { trpc } from "@/utils/trpc";
import { Currency, formatDate, useTranslation } from "@offline-sqlite/i18n";

type Sex = "M" | "F";

interface PatientFormData {
	name: string;
	sex: Sex;
	age: number | "";
	phone: string;
	address: string;
}

interface VisitData {
	id: string;
	patientId: string;
	visitTime: number;
	notes: string | null;
	amountPaid: number;
	patient: {
		id: string;
		name: string;
		sex: Sex;
		age: number;
		phone: string | null;
		address: string | null;
	};
	acts: Array<{
		id: string;
		visitTypeId: string;
		price: number;
		teeth: string[];
		visitType: {
			id: string;
			name: string;
		};
	}>;
}

function generateId() {
	return Math.random().toString(36).substring(2, 9);
}

const emptyPatientData: PatientFormData = {
	name: "",
	sex: "M",
	age: "",
	phone: "",
	address: "",
};

const visitFormSchema = z.object({
	patientId: z.string().min(1, "Patient is required"),
	visitTime: z.string().min(1, "Visit time is required"),
	notes: z.string().optional().default(""),
	amountPaid: z.number().int().min(0, "Amount paid cannot be negative"),
	acts: z
		.array(
			z.object({
				id: z.string(),
				visitTypeId: z.string().min(1, "Procedure type is required"),
				price: z.number().int().min(1, "Price must be greater than 0"),
				teeth: z.array(z.string()).min(1, "At least one tooth is required"),
			}),
		)
		.min(1, "At least one treatment act is required"),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

interface VisitFormProps {
	mode: "create" | "edit";
	visit?: VisitData;
	isLoading?: boolean;
}

export default function VisitForm({ mode, visit, isLoading }: VisitFormProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [patientSearch, setPatientSearch] = useState("");
	const [showPatientResults, setShowPatientResults] = useState(false);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [patientFormData, setPatientFormData] = useState<PatientFormData>(emptyPatientData);

	const patients = useQuery({
		...trpc.patient.search.queryOptions({ query: patientSearch }),
		enabled: patientSearch.length > 0,
	});
	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	const form = useForm({
		defaultValues: {
			patientId: "",
			visitTime: new Date().toISOString().slice(0, 16),
			notes: "",
			amountPaid: 0,
			acts: [
				{
					id: generateId(),
					visitTypeId: "",
					price: 0,
					teeth: [] as string[],
				},
			],
		},
		onSubmit: async ({ value }) => {
			await handleFormSubmit(value);
		},
	});

	useEffect(() => {
		if (mode === "edit" && visit) {
			form.setFieldValue("patientId", visit.patientId);
			form.setFieldValue("visitTime", new Date(visit.visitTime).toISOString().slice(0, 16));
			form.setFieldValue("notes", visit.notes || "");
			form.setFieldValue("amountPaid", visit.amountPaid);
			form.setFieldValue(
				"acts",
				visit.acts.map((act) => ({
					id: act.id,
					visitTypeId: act.visitTypeId,
					price: act.price,
					teeth: act.teeth,
				})),
			);
			setPatientFormData({
				name: visit.patient.name,
				sex: visit.patient.sex,
				age: visit.patient.age,
				phone: visit.patient.phone ?? "",
				address: visit.patient.address ?? "",
			});
			setPatientSearch(visit.patient.name);
		}
	}, [mode, visit, form]);

	const createPatientMutation = useMutation(
		trpc.patient.create.mutationOptions({
			onSuccess: (data) => {
				form.setFieldValue("patientId", data.id);
			},
		}),
	);

	const createVisitMutation = useMutation(
		trpc.visit.create.mutationOptions({
			onSuccess: () => {
				navigate("/visits");
			},
		}),
	);

	const updateVisitMutation = useMutation(
		trpc.visit.update.mutationOptions({
			onSuccess: () => {
				navigate("/visits");
			},
		}),
	);

	const handleFormSubmit = async (values: VisitFormValues) => {
		const validationResult = visitFormSchema.safeParse(values);
		if (!validationResult.success) {
			return;
		}

		let patientId = values.patientId;

		if (mode === "create" && (patientId === "new" || patientId === "")) {
			if (!patientFormData.name.trim()) {
				return;
			}
			const result = await createPatientMutation.mutateAsync({
				name: patientFormData.name.trim(),
				sex: patientFormData.sex,
				age: patientFormData.age || 0,
				phone: patientFormData.phone || undefined,
				address: patientFormData.address || undefined,
			});
			patientId = result.id;
		}

		if (!patientId || values.acts.length === 0) return;

		const actsPayload = values.acts.map((act) => ({
			visitTypeId: act.visitTypeId,
			price: act.price,
			teeth: act.teeth,
		}));

		if (mode === "create") {
			createVisitMutation.mutate({
				patientId,
				visitTime: new Date(values.visitTime).getTime(),
				notes: values.notes || undefined,
				amountPaid: values.amountPaid,
				acts: actsPayload,
			});
		} else if (mode === "edit" && visit) {
			updateVisitMutation.mutate({
				id: visit.id,
				visitTime: new Date(values.visitTime).getTime(),
				notes: values.notes || undefined,
				amountPaid: values.amountPaid,
				acts: actsPayload,
			});
		}
	};

	const handlePatientSelect = (patient: {
		id: string;
		name: string;
		sex: Sex;
		age: number;
		phone: string | null;
		address: string | null;
	}) => {
		form.setFieldValue("patientId", patient.id);
		setPatientFormData({
			name: patient.name,
			sex: patient.sex,
			age: patient.age,
			phone: patient.phone ?? "",
			address: patient.address ?? "",
		});
		setPatientSearch(patient.name);
		setShowPatientResults(false);
	};

	const handleCreateNewPatient = () => {
		form.setFieldValue("patientId", "new");
		setPatientFormData(emptyPatientData);
		setPatientSearch("");
		setShowPatientResults(false);
	};

	const handleClearPatient = () => {
		form.setFieldValue("patientId", "");
		setPatientSearch("");
		setPatientFormData(emptyPatientData);
	};

	const cancelForm = () => {
		navigate("/visits");
	};

	const hasSelectedPatient =
		form.getFieldValue("patientId") !== "" && form.getFieldValue("patientId") !== "new";

	const actsValue = form.getFieldValue("acts") || [];

	if (isLoading) {
		return (
			<div className="mx-auto flex w-full max-w-4xl items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-4xl py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">
					{mode === "create" ? t("visits.addNew") : t("visits.editVisit")}
				</h1>
				<p className="text-muted-foreground mt-1">{t("visits.description")}</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div
								className="bg-primary text-primary-foreground flex h-8 w-8 items-center
									justify-center rounded-full text-sm font-semibold"
							>
								1
							</div>
							<CardTitle className="text-lg">{t("visits.patientLabel")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 py-4">
						{mode === "create" && !hasSelectedPatient && (
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
										value={patientSearch}
										onChange={(e) => {
											setPatientSearch(e.target.value);
											setShowPatientResults(true);
										}}
										onFocus={() => setShowPatientResults(true)}
										placeholder={t("patients.searchPlaceholder")}
										className="pl-10"
									/>
								</div>

								{showPatientResults && patientSearch.length > 0 && (
									<div
										className="bg-background absolute z-10 mt-1 w-full rounded-md border
											shadow-lg"
									>
										{patients.data?.length === 0 && (
											<div className="text-muted-foreground px-4 py-3 text-sm">
												{t("visits.noPatientsFound")}
											</div>
										)}
										{patients.data?.map((patient) => (
											<button
												key={patient.id}
												type="button"
												className="hover:bg-muted flex w-full items-center gap-3 px-4
													py-3 text-left transition-colors"
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
											className="text-primary hover:bg-muted flex w-full items-center
												gap-3 border-t px-4 py-3 text-left transition-colors"
											onClick={handleCreateNewPatient}
										>
											<div
												className="bg-primary/10 flex h-8 w-8 items-center
													justify-center rounded-full"
											>
												<Plus className="h-4 w-4" />
											</div>
											<span className="font-medium">
												{t("visits.createNewPatient")}
											</span>
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
											{patientFormData.name || t("visits.selectOrCreatePatient")}
										</p>
										{patientFormData.name && (
											<p className="text-muted-foreground text-sm">
												{patientFormData.age || "0"} {t("patients.years")} •{" "}
												{patientFormData.sex === "M"
													? t("patients.sexMale")
													: t("patients.sexFemale")}
												{patientFormData.phone && ` • ${patientFormData.phone}`}
											</p>
										)}
									</div>
								</div>
								{mode === "create" && hasSelectedPatient && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleClearPatient}
									>
										{t("visits.change")}
									</Button>
								)}
							</div>

							<div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
								<div className="sm:col-span-2">
									<Label htmlFor="patient-name">{t("patients.nameLabel")} *</Label>
									<Input
										id="patient-name"
										value={patientFormData.name}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										placeholder={t("patients.namePlaceholder")}
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div>
									<Label htmlFor="patient-sex">{t("patients.sexLabel")} *</Label>
									<Select
										value={patientFormData.sex}
										onValueChange={(value) =>
											setPatientFormData((prev) => ({
												...prev,
												sex: value as Sex,
											}))
										}
										disabled={mode === "edit" || hasSelectedPatient}
									>
										<SelectTrigger id="patient-sex" className="mt-1.5 w-full">
											<SelectValue placeholder={t("patients.sexLabel")} />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="M">{t("patients.sexMale")}</SelectItem>
											<SelectItem value="F">{t("patients.sexFemale")}</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="patient-age">{t("patients.ageLabel")} *</Label>
									<Input
										id="patient-age"
										type="number"
										min={0}
										max={150}
										value={patientFormData.age || ""}
										placeholder="0"
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												age: e.target.value ? parseInt(e.target.value) : "",
											}))
										}
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div>
									<Label htmlFor="patient-phone">{t("patients.phoneLabel")}</Label>
									<Input
										id="patient-phone"
										value={patientFormData.phone}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												phone: e.target.value,
											}))
										}
										placeholder={t("patients.phonePlaceholder")}
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div>
									<Label htmlFor="patient-address">{t("patients.addressLabel")}</Label>
									<Input
										id="patient-address"
										value={patientFormData.address}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												address: e.target.value,
											}))
										}
										placeholder={t("patients.addressPlaceholder")}
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div
								className="bg-primary text-primary-foreground flex h-8 w-8 items-center
									justify-center rounded-full text-sm font-semibold"
							>
								2
							</div>
							<CardTitle className="text-lg">{t("visits.visitDetails")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 py-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label>{t("visits.visitDateTime")} *</Label>
								<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
									<PopoverTrigger className="w-full">
										<div
											className="border-input bg-background hover:bg-muted
												hover:text-foreground dark:bg-input/30 dark:border-input
												dark:hover:bg-input/50 aria-expanded:bg-muted
												aria-expanded:text-foreground focus-visible:ring-ring/50
												mt-1.5 flex h-9 w-full cursor-pointer items-center
												justify-start rounded-none border px-3 text-sm font-normal
												outline-none focus-visible:ring-1 disabled:pointer-events-none
												disabled:opacity-50"
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{form.getFieldValue("visitTime")
												? formatDate(new Date(form.getFieldValue("visitTime")))
												: t("visits.selectDate")}
										</div>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={
												form.getFieldValue("visitTime")
													? new Date(form.getFieldValue("visitTime"))
													: undefined
											}
											onSelect={(date) => {
												if (date) {
													const existingTime = form.getFieldValue("visitTime")
														? new Date(form.getFieldValue("visitTime"))
														: new Date();
													date.setHours(
														existingTime.getHours(),
														existingTime.getMinutes(),
													);
													form.setFieldValue(
														"visitTime",
														date.toISOString().slice(0, 16),
													);
													setDatePickerOpen(false);
												}
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div>
								<Label htmlFor="notes">{t("visits.clinicalNotes")}</Label>
								<div className="relative mt-1.5">
									<FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
									<form.Field name="notes">
										{(field) => (
											<Textarea
												id="notes"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder={t("visits.addClinicalObservations")}
												className="pl-10"
											/>
										)}
									</form.Field>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className="bg-primary text-primary-foreground flex h-8 w-8 items-center
										justify-center rounded-full text-sm font-semibold"
								>
									3
								</div>
								<CardTitle className="text-lg">{t("visits.treatmentActs")}</CardTitle>
							</div>
							<form.Field name="acts" mode="array">
								{(field) => (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											field.pushValue({
												id: generateId(),
												visitTypeId: "",
												price: 0,
												teeth: [],
											})
										}
									>
										<Plus className="mr-1 h-4 w-4" />
										{t("visits.addAct")}
									</Button>
								)}
							</form.Field>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 py-4">
						<form.Field name="acts" mode="array">
							{(field) => (
								<>
									{field.state.value.map((act, index) => (
										<div key={act.id} className="bg-card rounded-lg border p-4">
											<div className="mb-4 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="bg-muted flex h-6 w-6 items-center
															justify-center rounded-full text-xs font-medium"
													>
														{index + 1}
													</div>
													<span className="font-medium">
														{t("visits.treatmentAct")}
													</span>
												</div>
												{field.state.value.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => field.removeValue(index)}
														className="text-destructive hover:text-destructive"
													>
														<Trash2 className="mr-1 h-4 w-4" />
														{t("visits.removeAct")}
													</Button>
												)}
											</div>

											<div className="grid gap-4 sm:grid-cols-3">
												<div className="sm:col-span-1">
													<Label className="text-sm">
														{t("visits.procedureType")} *
													</Label>
													<form.Field name={`acts[${index}].visitTypeId`}>
														{(subField) => (
															<Select
																value={subField.state.value}
																onValueChange={(value) =>
																	subField.handleChange(value || "")
																}
															>
																<SelectTrigger className="mt-1.5 w-full">
																	<SelectValue>
																		{visitTypes.data?.find(
																			(vt) =>
																				vt.id ===
																				subField.state.value,
																		)?.name ??
																			t("visits.selectProcedure")}
																	</SelectValue>
																</SelectTrigger>
																<SelectContent>
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

												<div className="sm:col-span-1">
													<Label className="text-sm">{t("visits.price")} *</Label>
													<form.Field name={`acts[${index}].price`}>
														{(subField) => (
															<div className="relative mt-1.5">
																<Input
																	type="number"
																	value={subField.state.value || ""}
																	placeholder="0"
																	onChange={(e) =>
																		subField.handleChange(
																			e.target.value
																				? parseInt(e.target.value)
																				: 0,
																		)
																	}
																	className="pl-7"
																/>
															</div>
														)}
													</form.Field>
												</div>

												<div className="sm:col-span-1">
													<Label className="text-sm">
														{t("visits.teethTreated")} *
													</Label>
													<form.Field name={`acts[${index}].teeth`}>
														{(subField) => (
															<div className="mt-1.5">
																<ToothSelector
																	selectedTeeth={subField.state.value || []}
																	onChange={(teeth) =>
																		subField.handleChange(teeth)
																	}
																/>
																{subField.state.value &&
																	subField.state.value.length > 0 && (
																		<div className="mt-2">
																			<ToothBadge
																				teeth={subField.state.value}
																				onRemove={(tooth) =>
																					subField.handleChange(
																						subField.state.value.filter(
																							(t) =>
																								t !== tooth,
																						),
																					)
																				}
																			/>
																		</div>
																	)}
															</div>
														)}
													</form.Field>
												</div>
											</div>
										</div>
									))}
								</>
							)}
						</form.Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div
								className="bg-primary text-primary-foreground flex h-8 w-8 items-center
									justify-center rounded-full text-sm font-semibold"
							>
								4
							</div>
							<CardTitle className="text-lg">{t("visits.payment")}</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="py-4">
						<form.Subscribe
							selector={(state) => ({
								acts: state.values.acts || [],
								amountPaid: state.values.amountPaid || 0,
							})}
						>
							{(subState) => {
								const currentTotalAmount = subState.acts.reduce(
									(sum, act) => sum + (act?.price || 0),
									0,
								);
								const currentAmountPaid = subState.amountPaid || 0;
								const currentAmountLeft = currentTotalAmount - currentAmountPaid;

								return (
									<div className="bg-muted rounded-lg p-6">
										<div className="grid gap-6 sm:grid-cols-3">
											<div className="text-center sm:text-left">
												<p className="text-muted-foreground text-sm">
													{t("visits.totalAmountLabel")}
												</p>
												<p className="mt-1 text-2xl font-bold">
													<Currency size="lg" value={currentTotalAmount} />
												</p>
											</div>

											<div className="text-center sm:text-left">
												<Label
													htmlFor="amount-paid"
													className="text-muted-foreground text-sm"
												>
													{t("visits.amountPaidLabel")}
												</Label>
												<form.Field name="amountPaid">
													{(field) => (
														<div className="relative mt-1">
															<Input
																id="amount-paid"
																type="number"
																min={0}
																max={currentTotalAmount}
																value={field.state.value || ""}
																placeholder="0"
																onChange={(e) =>
																	field.handleChange(
																		e.target.value
																			? parseInt(e.target.value)
																			: 0,
																	)
																}
																className="pl-7 text-lg"
															/>
														</div>
													)}
												</form.Field>
											</div>

											<div className="text-center sm:text-left">
												<p className="text-muted-foreground text-sm">
													{t("visits.balanceDue")}
												</p>
												<p
													className={`mt-1 text-2xl font-bold ${currentAmountLeft > 0
														? "text-orange-600"
														: "text-green-600"
														}`}
												>
													<Currency value={currentAmountLeft} />
												</p>
											</div>
										</div>

										{currentAmountPaid > currentTotalAmount && (
											<p className="text-destructive mt-4 text-center text-sm">
												{t("visits.amountExceedError")}
											</p>
										)}
									</div>
								);
							}}
						</form.Subscribe>
					</CardContent>
				</Card>

				<div className="flex items-center justify-end gap-3 pt-4">
					<Button type="button" variant="outline" onClick={cancelForm} size="lg">
						{t("common.cancel")}
					</Button>
					<form.Subscribe
						selector={(state) => ({
							isSubmitting: state.isSubmitting,
							patientId: state.values.patientId,
							acts: state.values.acts || [],
						})}
					>
						{(subState) => {
							const hasSelectedPatient =
								subState.patientId !== "" && subState.patientId !== "new";
							const hasPatientValue =
								hasSelectedPatient ||
								(subState.patientId === "new" && patientFormData.name.trim() !== "");
							const hasActsValue =
								subState.acts.length > 0 &&
								subState.acts.every(
									(act) =>
										act?.visitTypeId &&
										act?.price > 0 &&
										act?.teeth &&
										act.teeth.length > 0,
								);
							const canSubmitValue = hasPatientValue && hasActsValue;

							return (
								<Button
									type="submit"
									disabled={!canSubmitValue || subState.isSubmitting}
									size="lg"
								>
									{subState.isSubmitting ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Check className="mr-2 h-4 w-4" />
									)}
									{mode === "create" ? t("visits.createVisit") : t("visits.saveChanges")}
								</Button>
							);
						}}
					</form.Subscribe>
				</div>
			</form>
		</div>
	);
}
