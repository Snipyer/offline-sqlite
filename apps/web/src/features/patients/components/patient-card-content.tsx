import {
	Calendar,
	CreditCard,
	MapPin,
	User,
	ChevronRight,
	Stethoscope,
	Pencil,
	PhoneCall,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ToothDisplay } from "@/features/tooth-selector/components/tooth-display";
import { getEntityColor } from "@/utils/entity-colors";
import { formatDate, useTranslation } from "@offline-sqlite/i18n";
import { Currency } from "@/components/currency";
import { VisitCard } from "@/features/visits/components/visit-card";
import { useDirection } from "@base-ui/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CallPatientDialog } from "./call-patient-dialog";

interface PatientCardProps {
	patient: {
		id: string;
		name: string;
		sex: "M" | "F";
		age: number | null;
		dateOfBirth: string | null;
		phone: string | null;
		address: string | null;
		medicalNotes: string | null;
	};
	lastVisit: {
		visitTime: number;
	} | null;
	visits: { id: string }[];
	totalUnpaid: number;
	onClick: () => void;
}

export function PatientCard({ patient, lastVisit, visits, totalUnpaid, onClick }: PatientCardProps) {
	const { t } = useTranslation();

	return (
		<div
			className="group border-border/50 hover:border-border bg-muted/30 hover:bg-card relative
				cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300"
			onClick={onClick}
		>
			{/* Hover gradient */}
			<div
				className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent
					to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			/>

			<div className="relative">
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-1 items-start gap-4">
						<div
							className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center
								rounded-xl"
						>
							<User className="text-primary h-6 w-6" />
						</div>
						<div className="min-w-0 flex-1">
							<div className="mb-1 flex items-center gap-2">
								<h3 className="truncate text-lg font-semibold">{patient.name}</h3>
							</div>
							<p className="text-muted-foreground flex items-center gap-2 text-sm">
								<Calendar className="h-3.5 w-3.5" />
								{lastVisit ? formatDate(lastVisit.visitTime) : t("patients.noVisits")}
							</p>

							<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
								<div className="flex items-center gap-1">
									<span className="text-muted-foreground">{t("patients.age")}:</span>
									<span className="font-medium">{patient.age}</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="text-muted-foreground">{t("patients.sex")}:</span>
									<span className="font-medium">
										{patient.sex === "M" ? t("patients.male") : t("patients.female")}
									</span>
								</div>
								{patient.phone && (
									<div className="flex items-center gap-1">
										<PhoneCall className="text-muted-foreground h-3.5 w-3.5" />
										<span className="font-medium">{patient.phone}</span>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col items-end gap-2">
						<div className="text-muted-foreground flex items-center gap-1 text-sm">
							<Calendar className="h-3.5 w-3.5" />
							<span>
								{visits.length} {t("patients.visits")}
							</span>
						</div>
						<ChevronRight
							className="text-muted-foreground h-5 w-5 transition-transform
								group-hover:translate-x-0.5"
						/>
					</div>
				</div>

				{totalUnpaid > 0 && (
					<div
						className="bg-destructive/10 mt-4 flex items-center gap-2 rounded-xl px-3 py-2
							text-sm"
					>
						<CreditCard className="text-destructive h-4 w-4" />
						<span className="text-destructive font-medium">
							{t("patients.unpaid")}: <Currency value={totalUnpaid} />
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

interface PatientSheetProps {
	patient: {
		id: string;
		name: string;
		sex: "M" | "F";
		age: number | null;
		dateOfBirth: string | null;
		phone: string | null;
		address: string | null;
		medicalNotes: string | null;
	};
	visits: {
		id: string;
		visitTime: number;
		totalAmount: number;
		amountPaid: number;
		amountLeft: number;
		acts: {
			id: string;
			price: number;
			visitTypeId: string;
			notes: string | null;
			visitType: { name: string };
			teeth: string[];
		}[];
	}[];
	totalUnpaid: number;
	appointments: {
		id: string;
		scheduledTime: string | Date;
		duration: number;
		status: "scheduled" | "completed" | "cancelled" | "no-show";
		notes: string | null;
		visitId: string | null;
		visitType: {
			id: string;
			name: string;
		} | null;
	}[];
	payments: {
		id: string;
		visitId: string;
		amount: number;
		paymentMethod: string;
		notes: string | null;
		recordedAt: string | Date;
	}[];
	onEdit?: () => void;
}

export function PatientSheetContent({
	patient,
	visits,
	totalUnpaid,
	appointments,
	payments,
	onEdit,
}: PatientSheetProps) {
	const { t } = useTranslation();
	const [hoveredVisitId, setHoveredVisitId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"visits" | "appointments" | "payments">("visits");
	const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
	const direction = useDirection();
	const isRtl = direction === "rtl";

	const getAppointmentStatusClasses = (status: "scheduled" | "completed" | "cancelled" | "no-show") => {
		switch (status) {
			case "completed":
				return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
			case "cancelled":
				return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
			case "no-show":
				return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
			case "scheduled":
			default:
				return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
		}
	};

	const getAppointmentStatusLabel = (status: "scheduled" | "completed" | "cancelled" | "no-show") => {
		switch (status) {
			case "completed":
				return t("appointments.statuses.completed");
			case "cancelled":
				return t("appointments.statuses.cancelled");
			case "no-show":
				return t("appointments.statuses.noShow");
			case "scheduled":
			default:
				return t("appointments.statuses.scheduled");
		}
	};

	const getAllVisitTeeth = () => {
		const teeth = new Set<string>();
		visits.forEach((visit) => {
			visit.acts.forEach((act) => {
				act.teeth.forEach((tooth) => teeth.add(tooth));
			});
		});
		return Array.from(teeth);
	};

	const getVisitTeeth = (visitId: string) => {
		const teeth = new Set<string>();
		const visit = visits.find((v) => v.id === visitId);
		if (visit) {
			visit.acts.forEach((act) => {
				act.teeth.forEach((tooth) => teeth.add(tooth));
			});
		}
		return Array.from(teeth);
	};

	const hasAnyTeeth = visits.some((visit) => visit.acts.some((act) => act.teeth.length > 0));

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{patient.phone && (
				<CallPatientDialog
					open={isCallDialogOpen}
					onOpenChange={setIsCallDialogOpen}
					patientName={patient.name}
					patientPhone={patient.phone}
				/>
			)}
			<div className="p-6">
				<div className="flex items-start gap-5">
					<div
						className="bg-primary/10 flex h-20 w-20 shrink-0 items-center justify-center
							rounded-2xl"
					>
						<User className="text-primary h-10 w-10" />
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<h2 className="text-2xl font-semibold tracking-tight">{patient.name}</h2>
							{onEdit && (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 cursor-pointer"
									onClick={onEdit}
								>
									<Pencil className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
							<span className="text-muted-foreground">
								{patient.sex === "M" ? t("patients.male") : t("patients.female")},{" "}
								{patient.age} {t("patients.years")}
							</span>
							{patient.phone && (
								<button
									type="button"
									className="text-muted-foreground hover:text-foreground bg-muted/70
										hover:bg-muted inline-flex cursor-pointer items-center gap-1.5
										rounded-md border px-2.5 py-1 text-xs font-medium"
									onClick={() => setIsCallDialogOpen(true)}
									aria-label={t("patients.callDialogOpenAria", {
										name: patient.name,
										phone: patient.phone,
									})}
								>
									<PhoneCall className="h-3.5 w-3.5" />
									{t("patients.call")}: {patient.phone}
								</button>
							)}
						</div>
						{patient.address && (
							<p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
								<MapPin className="h-3.5 w-3.5" />
								{patient.address}
							</p>
						)}
					</div>
					{totalUnpaid > 0 && (
						<div className="border-destructive/20 bg-destructive/10 rounded-xl border px-5 py-3">
							<p className="text-destructive text-center text-xs font-medium uppercase">
								{t("patients.unpaid")}
							</p>
							<p className="text-destructive text-center text-2xl font-bold">
								<Currency value={totalUnpaid} size="lg" />
							</p>
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-hidden">
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as "visits" | "appointments" | "payments")}
					className="flex h-full flex-col"
				>
					<div className="border-border/50 border-b px-6">
						<TabsList variant="line" className="h-10">
							<TabsTrigger value="visits">
								<Stethoscope className="h-4 w-4" />
								{t("patients.visitsTab")} ({visits.length})
							</TabsTrigger>
							<TabsTrigger value="appointments">
								<Calendar className="h-4 w-4" />
								{t("patients.appointmentsTab")} ({appointments.length})
							</TabsTrigger>
							<TabsTrigger value="payments">
								<CreditCard className="h-4 w-4" />
								{t("patients.paymentsTab")} ({payments.length})
							</TabsTrigger>
						</TabsList>
					</div>
					<div className="relative flex-1 overflow-hidden">
						<AnimatePresence mode="wait" initial={false}>
							{activeTab === "visits" ? (
								<motion.div
									key="visits"
									className="absolute inset-0 overflow-y-auto p-6"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.2, ease: "easeOut" }}
								>
									<div className="space-y-4">
										{visits.length === 0 ? (
											<div
												className="flex flex-col items-center justify-center py-12
													text-center"
											>
												<p className="text-muted-foreground">
													{t("patients.noVisits")}
												</p>
											</div>
										) : (
											visits.map((visit) => (
												<div
													key={visit.id}
													onMouseEnter={() => setHoveredVisitId(visit.id)}
													onMouseLeave={() => setHoveredVisitId(null)}
												>
													<VisitCard
														visit={visit}
														patientId={patient.id}
														showBorder
														borderColor={getEntityColor(visit.id)}
														isRtl={isRtl}
													/>
												</div>
											))
										)}
									</div>
								</motion.div>
							) : activeTab === "appointments" ? (
								<motion.div
									key="appointments"
									className="absolute inset-0 overflow-y-auto p-6"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.2, ease: "easeOut" }}
								>
									<div className="space-y-3">
										{appointments.length === 0 ? (
											<div
												className="flex flex-col items-center justify-center py-12
													text-center"
											>
												<p className="text-muted-foreground">
													{t("appointments.noAppointments")}
												</p>
											</div>
										) : (
											appointments.map((scheduledAppointment) => {
												const scheduledTime = new Date(
													scheduledAppointment.scheduledTime,
												);
												const statusClasses = getAppointmentStatusClasses(
													scheduledAppointment.status,
												);

												return (
													<div
														key={scheduledAppointment.id}
														className="border-border/50 hover:border-border
															rounded-xl border p-4 transition-colors"
													>
														<div
															className="flex items-start justify-between gap-3"
														>
															<div className="space-y-1">
																<p className="text-sm font-medium">
																	{formatDate(scheduledTime.getTime())}
																</p>
																<p className="text-muted-foreground text-xs">
																	<span>
																		{scheduledTime.toLocaleTimeString(
																			undefined,
																			{
																				hour: "2-digit",
																				minute: "2-digit",
																				hour12: false,
																			},
																		)}
																	</span>
																	<span className="mx-2">·</span>
																	<span>
																		{scheduledAppointment.duration}
																		{t("appointments.minutes")}
																	</span>
																</p>
																{scheduledAppointment.visitType?.name && (
																	<p
																		className="text-muted-foreground
																			text-xs"
																	>
																		{scheduledAppointment.visitType.name}
																	</p>
																)}
															</div>
															<span
																className={`inline-flex items-center
																	rounded-full border px-2 py-0.5 text-xs
																	font-medium ${statusClasses}`}
															>
																{getAppointmentStatusLabel(
																	scheduledAppointment.status,
																)}
															</span>
														</div>
														{scheduledAppointment.notes && (
															<p className="text-muted-foreground mt-3 text-sm">
																{scheduledAppointment.notes}
															</p>
														)}
													</div>
												);
											})
										)}
									</div>
								</motion.div>
							) : (
								<motion.div
									key="payments"
									className="absolute inset-0 overflow-y-auto p-6"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.2, ease: "easeOut" }}
								>
									<div className="space-y-3">
										{payments.length === 0 ? (
											<div
												className="flex flex-col items-center justify-center py-12
													text-center"
											>
												<p className="text-muted-foreground">
													{t("patients.noPayments")}
												</p>
											</div>
										) : (
											payments.map((payment) => (
												<div
													key={payment.id}
													className="border-border/50 hover:border-border rounded-xl
														border p-4 transition-colors"
												>
													<div className="flex items-center justify-between">
														<span className="text-sm font-medium">
															<Currency value={payment.amount} />
														</span>
														<span
															className="text-muted-foreground text-xs
																uppercase"
														>
															{formatDate(
																typeof payment.recordedAt === "string"
																	? new Date(payment.recordedAt).getTime()
																	: payment.recordedAt.getTime(),
															)}
														</span>
													</div>
													{payment.notes && (
														<span
															className="text-muted-foreground mt-2 block
																text-xs"
														>
															{payment.notes}
														</span>
													)}
												</div>
											))
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</Tabs>
			</div>

			{hasAnyTeeth && (
				<div className="border-border/50 border-t p-2">
					<div className="mx-auto w-full max-w-96">
						<ToothDisplay
							highlightedTeeth={
								hoveredVisitId ? getVisitTeeth(hoveredVisitId) : getAllVisitTeeth()
							}
							highlightColor={
								hoveredVisitId ? getEntityColor(hoveredVisitId) : "var(--primary)"
							}
							hovered={!!hoveredVisitId}
							otherHovered={!!hoveredVisitId}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
