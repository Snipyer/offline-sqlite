import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentCard } from "@/features/appointments/components/appointment-card";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
import { Calendar } from "@/features/appointments/components/calendar";
import { PatientSheet } from "@/features/patients/components";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import {
	pageContainerVariants,
	pageItemVariants,
	getSubtleListItemTransition,
	subtleListItemInitial,
	subtleListItemAnimate,
} from "@/lib/animations";

interface AppointmentWithPatient {
	id: string;
	patientId: string;
	scheduledTime: string | Date;
	duration: number;
	status: "scheduled" | "completed" | "cancelled" | "no-show";
	visitId: string | null;
	visitTypeId: string | null;
	notes: string | null;
	createdAt: string | Date;
	updatedAt: string | Date;
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
	visitType: {
		id: string;
		name: string;
	} | null;
}

export default function AppointmentsPage() {
	const { t, i18n } = useTranslation();
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingAppointment, setEditingAppointment] = useState<AppointmentWithPatient | null>(null);
	const [prefillTime, setPrefillTime] = useState<number | null>(null);
	const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

	const month = currentMonth.getMonth() + 1;
	const year = currentMonth.getFullYear();

	const appointments = useQuery({
		...trpc.appointment.list.queryOptions({ month, year }),
	});

	const selectedDateAppointments = useQuery({
		...trpc.appointment.getByDate.queryOptions({ date: selectedDate.getTime() }),
		enabled: !!selectedDate,
	});

	const deleteMutation = useMutation(
		trpc.appointment.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("appointments.deleted"));
				selectedDateAppointments.refetch();
				appointments.refetch();
			},
		}),
	);

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
	};

	const handleTimeSlotClick = (hour: number, minute: number) => {
		const date = new Date(selectedDate);
		date.setHours(hour, minute, 0, 0);
		setPrefillTime(date.getTime());
		setEditingAppointment(null);
		setIsFormOpen(true);
	};

	const handleEditAppointment = (appointment: AppointmentWithPatient) => {
		setEditingAppointment(appointment);
		setPrefillTime(null);
		setIsFormOpen(true);
	};

	const handleDeleteAppointment = (id: string) => {
		deleteMutation.mutate({ id });
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setEditingAppointment(null);
		setPrefillTime(null);
		selectedDateAppointments.refetch();
		appointments.refetch();
	};

	const timeSlots = useMemo(() => {
		const slots: { hour: number; minute: number; label: string }[] = [];
		for (let hour = 8; hour < 20; hour++) {
			for (let minute = 0; minute < 60; minute += 15) {
				slots.push({
					hour,
					minute,
					label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
				});
			}
		}
		return slots;
	}, []);

	const appointmentsByDate = useMemo(() => {
		if (!appointments.data) return new Map<string, AppointmentWithPatient[]>();
		const map = new Map<string, AppointmentWithPatient[]>();
		appointments.data.forEach((apt) => {
			const dateKey = new Date(apt.scheduledTime).toDateString();
			const existing = map.get(dateKey) || [];
			map.set(dateKey, [...existing, apt]);
		});
		return map;
	}, [appointments.data]);

	const appointmentsForSelectedDate = useMemo(() => {
		if (!selectedDateAppointments.data) return [];
		return selectedDateAppointments.data.sort(
			(a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
		);
	}, [selectedDateAppointments.data]);

	const locale = i18n.resolvedLanguage || i18n.language || undefined;

	const formattedDate = useMemo(() => {
		const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

		if (locale?.startsWith("fr")) {
			const dateParts = new Intl.DateTimeFormat(locale, {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			}).formatToParts(selectedDate);

			const weekday = dateParts.find((part) => part.type === "weekday")?.value ?? "";
			const day = dateParts.find((part) => part.type === "day")?.value ?? "";
			const month = dateParts.find((part) => part.type === "month")?.value ?? "";
			const year = dateParts.find((part) => part.type === "year")?.value ?? "";

			return `${capitalize(weekday)}, ${day} ${capitalize(month)} ${year}`;
		}

		return selectedDate.toLocaleDateString(locale, {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}, [locale, selectedDate]);

	const isToday = selectedDate.toDateString() === new Date().toDateString();

	const goToPreviousDay = () => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() - 1);
		setSelectedDate(newDate);
	};

	const goToNextDay = () => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + 1);
		setSelectedDate(newDate);
	};

	const goToToday = () => {
		setSelectedDate(new Date());
	};

	return (
		<motion.div
			variants={pageContainerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-6xl px-4 py-6"
		>
			<motion.div variants={pageItemVariants} className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
						<CalendarIcon className="text-primary h-6 w-6" />
					</div>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">{t("appointments.title")}</h1>
						<p className="text-muted-foreground text-sm">{t("appointments.manageSchedule")}</p>
					</div>
				</div>
				<Button
					onClick={() => {
						setEditingAppointment(null);
						setPrefillTime(null);
						setIsFormOpen(true);
					}}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					{t("appointments.new")}
				</Button>
			</motion.div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
				<motion.div variants={pageItemVariants} className="lg:col-span-4">
					<Card className="border-border/50 overflow-hidden">
						<CardContent className="p-0">
							<Calendar
								currentMonth={currentMonth}
								onMonthChange={setCurrentMonth}
								selectedDate={selectedDate}
								onDateSelect={handleDateSelect}
								appointmentsByDate={appointmentsByDate}
							/>
						</CardContent>
					</Card>

					<Card className="border-border/50 mt-4">
						<CardContent className="p-4">
							<h3
								className="text-muted-foreground mb-3 text-sm font-medium tracking-wide
									uppercase"
							>
								{t("appointments.quickSlots")}
							</h3>
							<div className="max-h-48 overflow-y-auto pr-1">
								<div className="grid grid-cols-4 gap-2">
									{timeSlots.map((slot) => {
										const slotTime = new Date(selectedDate);
										slotTime.setHours(slot.hour, slot.minute, 0, 0);
										const isPast = slotTime < new Date();

										return (
											<Button
												key={slot.label}
												variant="outline"
												size="sm"
												disabled={isPast}
												onClick={() => handleTimeSlotClick(slot.hour, slot.minute)}
												className="hover:border-primary/30 hover:bg-primary/5 text-xs"
											>
												{slot.label}
											</Button>
										);
									})}
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div variants={pageItemVariants} className="lg:col-span-8">
					<Card className="border-border/50 overflow-hidden pt-0">
						<div className="bg-muted/30 flex items-center justify-between border-b px-6 py-4">
							<div className="flex items-center gap-3">
								<Button
									variant="ghost"
									size="icon"
									onClick={goToPreviousDay}
									className="h-8 w-8"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<div className="min-w-0">
									<h3 className="font-semibold">{formattedDate}</h3>
									{isToday && (
										<span className="text-primary text-xs font-medium">
											{t("appointments.today")}
										</span>
									)}
								</div>
								<Button variant="ghost" size="icon" onClick={goToNextDay} className="h-8 w-8">
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
							{!isToday && (
								<Button variant="outline" size="sm" onClick={goToToday}>
									{t("appointments.goToToday")}
								</Button>
							)}
						</div>
						<CardContent className="p-6">
							{selectedDateAppointments.isLoading ? (
								<div className="flex justify-center py-12">
									<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
								</div>
							) : appointmentsForSelectedDate.length > 0 ? (
								<div className="space-y-3">
									<AnimatePresence mode="popLayout">
										{appointmentsForSelectedDate.map((apt, index) => (
											<motion.div
												key={apt.id}
												initial={subtleListItemInitial}
												animate={subtleListItemAnimate}
												transition={getSubtleListItemTransition(index)}
												layout
											>
												<AppointmentCard
													appointment={apt}
													onEdit={() => handleEditAppointment(apt)}
													onDelete={() => handleDeleteAppointment(apt.id)}
													onPatientClick={(patientId) =>
														setSelectedPatientId(patientId)
													}
												/>
											</motion.div>
										))}
									</AnimatePresence>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div
										className="bg-muted mb-4 flex h-16 w-16 items-center justify-center
											rounded-full"
									>
										<Clock className="text-muted-foreground h-8 w-8" />
									</div>
									<h4 className="mb-1 font-medium">{t("appointments.noAppointments")}</h4>
									<p className="text-muted-foreground mb-4 text-sm">
										{t("appointments.noAppointmentsHint")}
									</p>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setEditingAppointment(null);
											setPrefillTime(null);
											setIsFormOpen(true);
										}}
									>
										<Plus className="mr-2 h-4 w-4" />
										{t("appointments.scheduleOne")}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</motion.div>
			</div>

			<Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
				<SheetContent className="w-[95vw] max-w-150! overflow-y-auto">
					<SheetHeader>
						<SheetTitle>
							{editingAppointment ? t("appointments.edit") : t("appointments.create")}
						</SheetTitle>
						<SheetDescription>
							{editingAppointment
								? t("appointments.editDescription")
								: t("appointments.createDescription")}
						</SheetDescription>
					</SheetHeader>
					<div className="mt-4">
						<AppointmentForm
							appointment={editingAppointment}
							prefillTime={prefillTime}
							selectedDate={selectedDate}
							onSuccess={handleFormSuccess}
							onCancel={() => setIsFormOpen(false)}
						/>
					</div>
				</SheetContent>
			</Sheet>

			<PatientSheet patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} />
		</motion.div>
	);
}
