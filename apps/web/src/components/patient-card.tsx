import {
	Calendar,
	CalendarDays,
	CreditCard,
	ChevronRight,
	Clock,
	MapPin,
	VenusAndMars,
	CalendarClock,
	FileText,
	PhoneCall,
} from "lucide-react";
import { useState } from "react";
import { formatDate, useTranslation } from "@offline-sqlite/i18n";
import { Currency } from "@/components/currency";
import { getSubtleListItemTransition, subtleListItemAnimate, subtleListItemInitial } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { CallPatientDialog } from "@/features/patients/components/call-patient-dialog";

export interface PatientCardProps {
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
	upcomingAppointment?: {
		id: string;
		scheduledTime: Date | string;
		status: "scheduled" | "completed" | "cancelled" | "no-show";
	} | null;
	onClick?: () => void;
	variant?: "default" | "compact" | "detailed";
	className?: string;
	index?: number;
}

export function PatientCard({
	patient,
	lastVisit,
	visits,
	totalUnpaid,
	upcomingAppointment,
	onClick,
	variant = "default",
	className,
	index = 0,
}: PatientCardProps) {
	const { t } = useTranslation();
	const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
	const [ignoreCardClickUntil, setIgnoreCardClickUntil] = useState(0);

	const handleCardClick = () => {
		if (isCallDialogOpen || Date.now() < ignoreCardClickUntil) {
			return;
		}

		onClick?.();
	};

	const handleCallDialogOpenChange = (open: boolean) => {
		setIsCallDialogOpen(open);

		if (!open) {
			// Prevent click-through when closing from backdrop/cancel.
			setIgnoreCardClickUntil(Date.now() + 300);
		}
	};

	const getUpcomingAppointmentLabel = () => {
		if (!upcomingAppointment) return null;

		const appointmentDate = new Date(upcomingAppointment.scheduledTime);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		appointmentDate.setHours(0, 0, 0, 0);

		const daysDiff = Math.round((appointmentDate.getTime() - today.getTime()) / 86_400_000);

		if (daysDiff <= 0) {
			return t("patients.appointmentToday");
		}

		return t("patients.appointmentInDays", { days: daysDiff });
	};

	const upcomingAppointmentLabel = getUpcomingAppointmentLabel();

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getAvatarColor = (name: string) => {
		const colors = [
			"bg-blue-500/10 text-blue-600",
			"bg-emerald-500/10 text-emerald-600",
			"bg-violet-500/10 text-violet-600",
			"bg-amber-500/10 text-amber-600",
			"bg-rose-500/10 text-rose-600",
			"bg-cyan-500/10 text-cyan-600",
		];
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	};

	if (variant === "compact") {
		return (
			<motion.div
				initial={subtleListItemInitial}
				animate={subtleListItemAnimate}
				transition={getSubtleListItemTransition(index, 0, 0.05)}
				className={cn(
					`group border-border/50 bg-muted/30 hover:border-border hover:bg-card flex cursor-pointer
					items-center gap-4 rounded-xl border p-3
					transition-[background-color,border-color,box-shadow] duration-300`,
					className,
				)}
				onClick={handleCardClick}
			>
				<div
					className={cn(
						"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
						getAvatarColor(patient.name),
					)}
				>
					{getInitials(patient.name)}
				</div>
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-medium">{patient.name}</h4>
					<p className="text-muted-foreground text-xs">
						{patient.age} {t("patients.years")} ·{" "}
						{patient.sex === "M" ? t("patients.male") : t("patients.female")}
					</p>
				</div>
				{totalUnpaid > 0 && (
					<div className="text-destructive shrink-0 text-xs font-medium">
						<Currency value={totalUnpaid} size="sm" />
					</div>
				)}
				<ChevronRight
					className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-all
						group-hover:translate-x-0.5 group-hover:opacity-100"
				/>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={subtleListItemInitial}
			animate={subtleListItemAnimate}
			transition={getSubtleListItemTransition(index, 0, 0.05)}
			className={cn(
				`group border-border/50 hover:border-border bg-muted/30 hover:bg-card relative cursor-pointer
				overflow-hidden rounded-2xl border p-5 transition-[background-color,border-color,box-shadow]
				duration-300`,
				className,
			)}
			onClick={handleCardClick}
		>
			{/* Hover gradient overlay */}
			<div
				className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent
					to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			/>

			<div className="relative">
				<div className="flex items-center gap-4">
					{/* Avatar with initials */}
					<div
						className={cn(
							`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg
							font-semibold transition-transform duration-300 group-hover:scale-105`,
							getAvatarColor(patient.name),
						)}
					>
						{getInitials(patient.name)}
					</div>

					{/* Main content - flex-1 */}
					<div className="min-w-0 flex-1">
						<div className="mb-1 flex items-center gap-2">
							<h3 className="truncate text-lg font-semibold">{patient.name}</h3>
						</div>

						<p className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
							<Calendar className="h-3.5 w-3.5" />
							{lastVisit ? formatDate(lastVisit.visitTime) : t("patients.noVisits")}
						</p>

						{patient.medicalNotes && (
							<p className="text-muted-foreground my-2 flex items-center gap-1.5 text-sm">
								<FileText className="h-3.5 w-3.5 shrink-0" />
								<span className="line-clamp-1">{patient.medicalNotes}</span>
							</p>
						)}

						{/* Patient details row */}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
							<div className="bg-muted flex items-center gap-1.5 rounded-lg px-2.5 py-1">
								<CalendarDays className="text-muted-foreground h-3.5 w-3.5" />
								<span className="text-muted-foreground text-xs">{t("patients.age")}</span>
								<span className="font-medium">{patient.age}</span>
							</div>
							<div className="bg-muted flex items-center gap-1.5 rounded-lg px-2.5 py-1">
								<VenusAndMars className="text-muted-foreground h-3.5 w-3.5" />
								<span className="text-muted-foreground text-xs">{t("patients.sex")}</span>
								<span className="font-medium">
									{patient.sex === "M" ? t("patients.male") : t("patients.female")}
								</span>
							</div>
							{patient.phone && (
								<>
									<button
										type="button"
										className="bg-muted hover:bg-muted/80 flex cursor-pointer items-center
											gap-1.5 rounded-lg px-2.5 py-1 text-start"
										onPointerDown={(event) => event.stopPropagation()}
										onMouseDown={(event) => event.stopPropagation()}
										onClick={(event) => {
											event.stopPropagation();
											setIgnoreCardClickUntil(Date.now() + 300);
											setIsCallDialogOpen(true);
										}}
										aria-label={t("patients.callDialogOpenAria", {
											name: patient.name,
											phone: patient.phone,
										})}
									>
										<PhoneCall className="text-muted-foreground h-3.5 w-3.5" />
										<span className="text-muted-foreground text-xs">
											{t("patients.call")}
										</span>
										<span className="font-medium">{patient.phone}</span>
									</button>
									<CallPatientDialog
										open={isCallDialogOpen}
										onOpenChange={handleCallDialogOpenChange}
										patientName={patient.name}
										patientPhone={patient.phone}
									/>
								</>
							)}
							{patient.address && (
								<div
									className="bg-muted flex max-w-full items-center gap-1.5 rounded-lg px-2.5
										py-1"
								>
									<MapPin className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
									<span className="text-muted-foreground text-xs">
										{t("patients.address")}
									</span>
									<span className="truncate font-medium">{patient.address}</span>
								</div>
							)}
							{upcomingAppointmentLabel && (
								<div
									className="inline-flex items-center gap-1.5 rounded-lg border
										border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-700
										dark:text-emerald-300"
								>
									<CalendarClock className="h-3.5 w-3.5" />
									<span className="text-xs font-medium">{upcomingAppointmentLabel}</span>
								</div>
							)}
						</div>
					</div>

					{/* Right side - Unpaid balance or visit count */}
					<div className="flex shrink-0 flex-col items-end gap-2">
						{totalUnpaid > 0 ? (
							<div className="flex flex-col items-end">
								{/* Icon and label on same line */}
								<div className="mb-1 flex items-center gap-1.5">
									<div
										className="bg-destructive/10 flex h-6 w-6 items-center justify-center
											rounded-lg"
									>
										<CreditCard className="text-destructive h-3.5 w-3.5" />
									</div>
									<span className="text-destructive/70 text-xs font-medium">
										{t("patients.unpaid")}
									</span>
								</div>
								{/* Amount underneath */}
								<span className="text-destructive text-xl font-bold">
									<Currency value={totalUnpaid} />
								</span>
							</div>
						) : (
							<div className="flex flex-col items-end gap-1">
								<div className="text-muted-foreground flex items-center gap-1 text-sm">
									<Clock className="h-3.5 w-3.5" />
									<span>
										{visits.length} {t("patients.visits")}
									</span>
								</div>
							</div>
						)}

						{/* Arrow indicator */}
						<div
							className="bg-muted group-hover:bg-primary/10 hidden h-8 w-8 items-center
								justify-center rounded-full opacity-0 transition-all group-hover:opacity-100
								sm:flex"
						>
							<ChevronRight
								className="text-muted-foreground group-hover:text-primary h-4 w-4
									transition-all group-hover:translate-x-0.5"
							/>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export default PatientCard;
