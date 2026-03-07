import { useState } from "react";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useTranslation } from "@offline-sqlite/i18n";

interface CalendarProps<T extends { id: string; scheduledTime: Date | string }> {
	currentMonth: Date;
	onMonthChange: (date: Date) => void;
	selectedDate: Date;
	onDateSelect: (date: Date) => void;
	appointmentsByDate: Map<string, T[]>;
}

export function Calendar<T extends { id: string; scheduledTime: Date | string }>({
	currentMonth,
	onMonthChange,
	selectedDate,
	onDateSelect,
	appointmentsByDate,
}: CalendarProps<T>) {
	const { i18n } = useTranslation();
	const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDay = firstDay.getDay();

		const days: (Date | null)[] = [];

		for (let i = 0; i < startingDay; i++) {
			days.push(null);
		}

		for (let i = 1; i <= daysInMonth; i++) {
			days.push(new Date(year, month, i));
		}

		return days;
	};

	const days = getDaysInMonth(currentMonth);

	const goToPreviousMonth = () => {
		const newMonth = new Date(currentMonth);
		newMonth.setMonth(newMonth.getMonth() - 1);
		onMonthChange(newMonth);
	};

	const goToNextMonth = () => {
		const newMonth = new Date(currentMonth);
		newMonth.setMonth(newMonth.getMonth() + 1);
		onMonthChange(newMonth);
	};

	const isSameDay = (date1: Date, date2: Date | null) => {
		if (!date2) return false;
		return (
			date1.getDate() === date2.getDate() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getFullYear() === date2.getFullYear()
		);
	};

	const hasAppointments = (date: Date) => {
		const dateKey = date.toDateString();
		return appointmentsByDate.has(dateKey) && appointmentsByDate.get(dateKey)!.length > 0;
	};

	const getAppointmentCount = (date: Date) => {
		const dateKey = date.toDateString();
		return appointmentsByDate.get(dateKey)?.length || 0;
	};

	const locale = i18n.resolvedLanguage || i18n.language || undefined;
	const weekDayFormatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
	const weekDays = Array.from({ length: 7 }, (_, index) => {
		const referenceSunday = new Date(2024, 0, 7 + index);
		return weekDayFormatter.format(referenceSunday);
	});
	const monthYear = currentMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });

	return (
		<div className="p-4">
			<div className="mb-4 flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={goToPreviousMonth}
					className="hover:bg-muted h-8 w-8"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<motion.h3
					key={monthYear}
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="font-semibold"
				>
					{monthYear}
				</motion.h3>
				<Button
					variant="ghost"
					size="icon"
					onClick={goToNextMonth}
					className="hover:bg-muted h-8 w-8"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			<div className="mb-2 grid grid-cols-7 gap-1">
				{weekDays.map((day, index) => (
					<div
						key={`${day}-${index}`}
						className="text-muted-foreground flex h-8 items-center justify-center text-xs
							font-medium"
					>
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{days.map((day, index) => {
					if (!day) {
						return <div key={`empty-${index}`} className="h-10" />;
					}

					const isSelected = isSameDay(day, selectedDate);
					const isToday = isSameDay(day, new Date());
					const hasApts = hasAppointments(day);
					const aptCount = getAppointmentCount(day);
					const isHovered = hoveredDate && isSameDay(day, hoveredDate);

					return (
						<motion.button
							key={`${day.toISOString()}-${index}`}
							onClick={() => onDateSelect(day)}
							onMouseEnter={() => setHoveredDate(day)}
							onMouseLeave={() => setHoveredDate(null)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`relative flex h-10 flex-col items-center justify-center rounded-lg
							text-sm transition-all ${
								isSelected
									? "bg-primary text-primary-foreground shadow-md"
									: isToday
										? "bg-primary/10 text-primary ring-primary/20 font-semibold ring-1"
										: isHovered
											? "bg-muted"
											: "hover:bg-muted/50"
							}`}
						>
							<span className={hasApts && !isSelected ? "font-medium" : ""}>
								{day.getDate()}
							</span>
							{hasApts && (
								<div className="absolute bottom-1 flex gap-0.5">
									{aptCount <= 3 ? (
										Array.from({ length: aptCount }).map((_, i) => (
											<div
												key={i}
												className={`h-1 w-1 rounded-full ${
													isSelected ? "bg-primary-foreground/80" : "bg-primary"
												}`}
											/>
										))
									) : (
										<div
											className={`flex h-3 items-center justify-center rounded-full px-1
												text-[8px] font-medium
												${isSelected ? "bg-primary-foreground/20" : "bg-primary/20"}
												${isSelected ? "text-primary-foreground" : "text-primary"}`}
										>
											{aptCount}
										</div>
									)}
								</div>
							)}
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
