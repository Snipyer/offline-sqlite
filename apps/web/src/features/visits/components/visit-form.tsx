import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Loader2,
	Plus,
	Trash2,
	X,
	Check,
	Search,
	User,
	Calendar,
	Stethoscope,
	CreditCard,
	FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToothSelector, ToothBadge } from "@/features/tooth-selector/components/tooth-selector";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";

type Sex = "M" | "F";

interface ActInput {
	id: string;
	visitTypeId: string;
	price: number;
	teeth: string[];
}

interface PatientFormData {
	name: string;
	sex: Sex;
	age: number;
	phone: string;
	address: string;
}

interface VisitFormData {
	patientId: string;
	visitTime: string;
	notes: string;
	amountPaid: number;
	acts: ActInput[];
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

const emptyAct = (): ActInput => ({
	id: generateId(),
	visitTypeId: "",
	price: 0,
	teeth: [],
});

const emptyPatientData: PatientFormData = {
	name: "",
	sex: "M",
	age: 30,
	phone: "",
	address: "",
};

const emptyFormData: VisitFormData = {
	patientId: "",
	visitTime: new Date().toISOString().slice(0, 16),
	notes: "",
	amountPaid: 0,
	acts: [emptyAct()],
};

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

	const [patientFormData, setPatientFormData] = useState<PatientFormData>(emptyPatientData);
	const [formData, setFormData] = useState<VisitFormData>(emptyFormData);

	const patients = useQuery({
		...trpc.patient.search.queryOptions({ query: patientSearch }),
		enabled: patientSearch.length > 0,
	});
	const visitTypes = useQuery(trpc.visitType.list.queryOptions());

	useEffect(() => {
		if (mode === "edit" && visit) {
			setFormData({
				patientId: visit.patientId,
				visitTime: new Date(visit.visitTime).toISOString().slice(0, 16),
				notes: visit.notes || "",
				amountPaid: visit.amountPaid,
				acts: visit.acts.map((act) => ({
					id: act.id,
					visitTypeId: act.visitTypeId,
					price: act.price,
					teeth: act.teeth,
				})),
			});
			setPatientFormData({
				name: visit.patient.name,
				sex: visit.patient.sex,
				age: visit.patient.age,
				phone: visit.patient.phone ?? "",
				address: visit.patient.address ?? "",
			});
			setPatientSearch(visit.patient.name);
		}
	}, [mode, visit]);

	const createPatientMutation = useMutation(
		trpc.patient.create.mutationOptions({
			onSuccess: (data) => {
				setFormData((prev) => ({ ...prev, patientId: data.id }));
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

	const totalAmount = formData.acts.reduce((sum, act) => sum + act.price, 0);
	const amountLeft = totalAmount - formData.amountPaid;

	const handlePatientSelect = (patient: {
		id: string;
		name: string;
		sex: Sex;
		age: number;
		phone: string | null;
		address: string | null;
	}) => {
		setFormData((prev) => ({ ...prev, patientId: patient.id }));
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
		setFormData((prev) => ({ ...prev, patientId: "new" }));
		setPatientFormData(emptyPatientData);
		setPatientSearch("");
		setShowPatientResults(false);
	};

	const handleClearPatient = () => {
		setFormData((prev) => ({ ...prev, patientId: "" }));
		setPatientSearch("");
		setPatientFormData(emptyPatientData);
	};

	const handleAddAct = () => {
		setFormData((prev) => ({
			...prev,
			acts: [...prev.acts, emptyAct()],
		}));
	};

	const handleRemoveAct = (actId: string) => {
		setFormData((prev) => ({
			...prev,
			acts: prev.acts.filter((a) => a.id !== actId),
		}));
	};

	const updateAct = (actId: string, updates: Partial<ActInput>) => {
		setFormData((prev) => ({
			...prev,
			acts: prev.acts.map((a) => (a.id === actId ? { ...a, ...updates } : a)),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		let patientId = formData.patientId;

		if (mode === "create" && (patientId === "new" || patientId === "")) {
			if (!patientFormData.name.trim()) return;
			const result = await createPatientMutation.mutateAsync({
				name: patientFormData.name.trim(),
				sex: patientFormData.sex,
				age: patientFormData.age,
				phone: patientFormData.phone || undefined,
				address: patientFormData.address || undefined,
			});
			patientId = result.id;
		}

		if (!patientId || formData.acts.length === 0) return;

		const actsPayload = formData.acts.map((act) => ({
			visitTypeId: act.visitTypeId,
			price: act.price,
			teeth: act.teeth,
		}));

		if (mode === "create") {
			createVisitMutation.mutate({
				patientId,
				visitTime: new Date(formData.visitTime).getTime(),
				notes: formData.notes || undefined,
				amountPaid: formData.amountPaid,
				acts: actsPayload,
			});
		} else if (mode === "edit" && visit) {
			updateVisitMutation.mutate({
				id: visit.id,
				visitTime: new Date(formData.visitTime).getTime(),
				notes: formData.notes || undefined,
				amountPaid: formData.amountPaid,
				acts: actsPayload,
			});
		}
	};

	const cancelForm = () => {
		navigate("/visits");
	};

	const isSubmitting =
		createVisitMutation.isPending || updateVisitMutation.isPending || createPatientMutation.isPending;

	const isValid =
		((formData.patientId && formData.patientId !== "new") ||
			(mode === "create" && formData.patientId === "new" && patientFormData.name.trim())) &&
		formData.acts.length > 0 &&
		formData.acts.every((act) => act.visitTypeId && act.teeth.length > 0 && act.price >= 0) &&
		formData.amountPaid <= totalAmount;

	const hasSelectedPatient = formData.patientId !== "" && formData.patientId !== "new";

	if (isLoading) {
		return (
			<div className="mx-auto flex w-full max-w-4xl items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-4xl py-8">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">
					{mode === "create" ? t("visits.addNew") : t("visits.editVisit")}
				</h1>
				<p className="text-muted-foreground mt-1">{t("visits.description")}</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Step 1: Patient Selection */}
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
					<CardContent className="space-y-4">
						{mode === "create" && !hasSelectedPatient && (
							<div className="relative">
								<Label className="mb-2 block text-sm font-medium">
									Search for existing patient or create new
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
												No patients found
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
														{patient.age} years •{" "}
														{patient.sex === "M" ? "Male" : "Female"}
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
											<span className="font-medium">Create new patient</span>
										</button>
									</div>
								)}
							</div>
						)}

						{/* Patient Info Card - Always show fields */}
						<div className="bg-card rounded-lg border p-4">
							{/* Header with patient info summary */}
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
											{patientFormData.name || "Select or Create Patient"}
										</p>
										{patientFormData.name && (
											<p className="text-muted-foreground text-sm">
												{patientFormData.age} years •{" "}
												{patientFormData.sex === "M" ? "Male" : "Female"}
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
										Change
									</Button>
								)}
							</div>

							{/* Patient Form Fields - Always visible */}
							<div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
								<div className="sm:col-span-2">
									<Label htmlFor="patient-name">Full Name *</Label>
									<Input
										id="patient-name"
										value={patientFormData.name}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										placeholder="Enter patient name"
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div>
									<Label htmlFor="patient-sex">Sex *</Label>
									<select
										id="patient-sex"
										value={patientFormData.sex}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												sex: e.target.value as Sex,
											}))
										}
										className="border-input bg-background mt-1.5 h-10 w-full rounded-md
											border px-3"
										disabled={mode === "edit" || hasSelectedPatient}
									>
										<option value="M">Male</option>
										<option value="F">Female</option>
									</select>
								</div>
								<div>
									<Label htmlFor="patient-age">Age *</Label>
									<Input
										id="patient-age"
										type="number"
										min={0}
										max={150}
										value={patientFormData.age}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												age: parseInt(e.target.value) || 0,
											}))
										}
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div>
									<Label htmlFor="patient-phone">Phone</Label>
									<Input
										id="patient-phone"
										value={patientFormData.phone}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												phone: e.target.value,
											}))
										}
										placeholder="Optional"
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
								<div className="sm:col-span-2">
									<Label htmlFor="patient-address">Address</Label>
									<Input
										id="patient-address"
										value={patientFormData.address}
										onChange={(e) =>
											setPatientFormData((prev) => ({
												...prev,
												address: e.target.value,
											}))
										}
										placeholder="Optional"
										className="mt-1.5"
										disabled={mode === "edit" || hasSelectedPatient}
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Step 2: Visit Details */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div
								className="bg-primary text-primary-foreground flex h-8 w-8 items-center
									justify-center rounded-full text-sm font-semibold"
							>
								2
							</div>
							<CardTitle className="text-lg">Visit Details</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<Label htmlFor="visit-time">Visit Date & Time *</Label>
								<div className="relative mt-1.5">
									<Calendar
										className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4
											-translate-y-1/2"
									/>
									<Input
										id="visit-time"
										type="datetime-local"
										value={formData.visitTime}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, visitTime: e.target.value }))
										}
										className="pl-10"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="notes">Clinical Notes</Label>
								<div className="relative mt-1.5">
									<FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
									<textarea
										id="notes"
										value={formData.notes}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, notes: e.target.value }))
										}
										placeholder="Add any clinical observations..."
										className="border-input bg-background min-h-[80px] w-full rounded-md
											border px-3 py-2 pl-10 text-sm"
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Step 3: Treatment Acts */}
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
								<CardTitle className="text-lg">Treatment Acts</CardTitle>
							</div>
							<Button type="button" variant="outline" size="sm" onClick={handleAddAct}>
								<Plus className="mr-1 h-4 w-4" />
								Add Act
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{formData.acts.map((act, index) => (
							<div key={act.id} className="bg-card rounded-lg border p-4">
								<div className="mb-4 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="bg-muted flex h-6 w-6 items-center justify-center
												rounded-full text-xs font-medium"
										>
											{index + 1}
										</div>
										<span className="font-medium">Treatment Act</span>
									</div>
									{formData.acts.length > 1 && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => handleRemoveAct(act.id)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="mr-1 h-4 w-4" />
											Remove
										</Button>
									)}
								</div>

								<div className="grid gap-4 sm:grid-cols-3">
									<div className="sm:col-span-1">
										<Label className="text-sm">Procedure Type *</Label>
										<select
											value={act.visitTypeId}
											onChange={(e) =>
												updateAct(act.id, { visitTypeId: e.target.value })
											}
											className="border-input bg-background mt-1.5 h-10 w-full
												rounded-md border px-3"
										>
											<option value="">Select procedure</option>
											{visitTypes.data?.map((vt) => (
												<option key={vt.id} value={vt.id}>
													{vt.name}
												</option>
											))}
										</select>
									</div>

									<div className="sm:col-span-1">
										<Label className="text-sm">Price *</Label>
										<div className="relative mt-1.5">
											<span
												className="text-muted-foreground absolute top-1/2 left-3
													-translate-y-1/2 text-sm"
											>
												$
											</span>
											<Input
												type="number"
												min={0}
												value={act.price}
												onChange={(e) =>
													updateAct(act.id, {
														price: parseInt(e.target.value) || 0,
													})
												}
												className="pl-7"
												placeholder="0"
											/>
										</div>
									</div>

									<div className="sm:col-span-1">
										<Label className="text-sm">Teeth Treated *</Label>
										<div className="mt-1.5">
											<ToothSelector
												selectedTeeth={act.teeth}
												onChange={(teeth) => updateAct(act.id, { teeth })}
											/>
										</div>
										{act.teeth.length > 0 && (
											<div className="mt-2">
												<ToothBadge
													teeth={act.teeth}
													onRemove={(tooth) =>
														updateAct(act.id, {
															teeth: act.teeth.filter((t) => t !== tooth),
														})
													}
												/>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Step 4: Payment Summary */}
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div
								className="bg-primary text-primary-foreground flex h-8 w-8 items-center
									justify-center rounded-full text-sm font-semibold"
							>
								4
							</div>
							<CardTitle className="text-lg">Payment</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<div className="bg-muted rounded-lg p-6">
							<div className="grid gap-6 sm:grid-cols-3">
								<div className="text-center sm:text-left">
									<p className="text-muted-foreground text-sm">Total Amount</p>
									<p className="mt-1 text-2xl font-bold">${totalAmount}</p>
								</div>

								<div className="text-center sm:text-left">
									<Label htmlFor="amount-paid" className="text-muted-foreground text-sm">
										Amount Paid
									</Label>
									<div className="relative mt-1">
										<span
											className="text-muted-foreground absolute top-1/2 left-3
												-translate-y-1/2"
										>
											$
										</span>
										<Input
											id="amount-paid"
											type="number"
											min={0}
											max={totalAmount}
											value={formData.amountPaid}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													amountPaid: parseInt(e.target.value) || 0,
												}))
											}
											className="pl-7 text-lg"
										/>
									</div>
								</div>

								<div className="text-center sm:text-left">
									<p className="text-muted-foreground text-sm">Balance Due</p>
									<p
										className={`mt-1 text-2xl font-bold ${
											amountLeft > 0 ? "text-orange-600" : "text-green-600"
										}`}
									>
										${amountLeft}
									</p>
								</div>
							</div>

							{formData.amountPaid > totalAmount && (
								<p className="text-destructive mt-4 text-center text-sm">
									Amount paid cannot exceed total
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3 pt-4">
					<Button type="button" variant="outline" onClick={cancelForm} size="lg">
						Cancel
					</Button>
					<Button type="submit" disabled={!isValid || isSubmitting} size="lg">
						{isSubmitting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Check className="mr-2 h-4 w-4" />
						)}
						{mode === "create" ? "Create Visit" : "Save Changes"}
					</Button>
				</div>
			</form>
		</div>
	);
}
