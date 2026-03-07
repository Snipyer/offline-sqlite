import { Pencil, Trash2, Clock, User, Stethoscope, FileText } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useTranslation } from "@offline-sqlite/i18n";
import { getSubtleListItemTransition, subtleListItemInitial, subtleListItemAnimate } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface Appointment {
	id: string;
	patientId: string;
	scheduledTime: Date | string;
	duration: number;
	status: "scheduled" | "completed" | "cancelled" | "no-show";
	visitId: string | null;
	visitTypeId: string | null;
	notes: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	patient: {
		id: string;
		name: string;
		sex: "M" | "F";
		age: number;
		phone: string | null;
		address: string | null;
	};
	visitType: {
		id: string;
		name: string;
	} | null;
}

interface AppointmentCardProps {
	appointment: Appointment;
	onEdit: () => void;
	onDelete: () => void;
	onPatientClick?: (patientId: string) => void;
	index?: number;
}

export function AppointmentCard({
	appointment,
	onEdit,
	onDelete,
	onPatientClick,
	index = 0,
}: AppointmentCardProps) {
	const { t } = useTranslation();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const scheduledTime = new Date(appointment.scheduledTime);
	const endTime = new Date(scheduledTime.getTime() + appointment.duration * 60000);

	const timeString = `${scheduledTime.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	})} - ${endTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

	const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
		scheduled: {
			label: t("appointments.statuses.scheduled"),
			bg: "bg-blue-500/10",
			text: "text-blue-600",
			border: "border-blue-500/20",
		},
		completed: {
			label: t("appointments.statuses.completed"),
			bg: "bg-emerald-500/10",
			text: "text-emerald-600",
			border: "border-emerald-500/20",
		},
		cancelled: {
			label: t("appointments.statuses.cancelled"),
			bg: "bg-red-500/10",
			text: "text-red-600",
			border: "border-red-500/20",
		},
		"no-show": {
			label: t("appointments.statuses.noShow"),
			bg: "bg-amber-500/10",
			text: "text-amber-600",
			border: "border-amber-500/20",
		},
	};

	const status = statusConfig[appointment.status] || statusConfig.scheduled;

	const handleDelete = () => {
		setShowDeleteDialog(false);
		onDelete();
	};

	const handlePatientClick = () => {
		onPatientClick?.(appointment.patient.id);
	};

	return (
		<motion.div
			initial={subtleListItemInitial}
			animate={subtleListItemAnimate}
			transition={getSubtleListItemTransition(index, 0, 0.05)}
			className={cn(
				`group border-border/50 hover:border-border bg-muted/30 hover:bg-card relative
				overflow-hidden`,
				"rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] duration-300",
			)}
		>
			<div
				className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent
					to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			/>

			<div className="relative">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-4">
						<div
							className={cn(
								"flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
								status.bg,
							)}
						>
							<Clock className={cn("h-6 w-6", status.text)} />
						</div>

						<div className="min-w-0 flex-1">
							<div className="mb-1 flex items-center gap-2">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handlePatientClick();
									}}
									className="hover:text-primary cursor-pointer truncate text-lg
										font-semibold underline-offset-4 transition-colors hover:underline"
								>
									{appointment.patient.name}
								</button>
							</div>

							<p className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
								<Clock className="h-3.5 w-3.5 shrink-0" />
								{timeString}
							</p>

							{appointment.visitType && (
								<div className="flex items-center gap-2 text-sm">
									<Stethoscope className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
									<span className="text-muted-foreground">
										{appointment.visitType.name}
									</span>
								</div>
							)}

							{appointment.notes && (
								<div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
									<FileText className="h-3.5 w-3.5 shrink-0" />
									<span className="line-clamp-2 text-sm">{appointment.notes}</span>
								</div>
							)}
						</div>
					</div>

					<div className="flex shrink-0 gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-lg"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
							aria-label={t("appointments.edit")}
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-destructive hover:text-destructive h-8 w-8 rounded-lg"
							onClick={(e) => {
								e.stopPropagation();
								setShowDeleteDialog(true);
							}}
							aria-label={t("common.delete")}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="border-border/50 mt-4 flex items-center justify-between border-t pt-4">
					<span
						className={cn(
							`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs
							font-medium`,
							status.bg,
							status.text,
							status.border,
						)}
					>
						{status.label}
					</span>
					<span className="text-muted-foreground text-sm">
						{appointment.duration} {t("appointments.minutes")}
					</span>
				</div>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("appointments.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("appointments.deleteDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={handleDelete}>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.div>
	);
}
