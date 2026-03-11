"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "./scroll-area";

interface DateTimePickerProps {
	value?: Date;
	onChange: (date: Date) => void;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
}

/**
 * A DateTimePicker component that integrates with TanStack Form.
 *
 * Features:
 * - Date selection via calendar
 * - Time selection via scrollable hour/minute buttons
 * - 24-hour format
 * - Controlled component (value/onChange)
 *
 * Usage with TanStack Form:
 *
 * ```tsx
 * import { useForm } from "@tanstack/react-form";
 * import { DateTimePicker } from "@/components/ui/datetime-picker";
 *
 * const form = useForm({
 *   defaultValues: { datetime: new Date() },
 *   onSubmit: async ({ value }) => {
 *     console.log(value.datetime);
 *   }
 * });
 *
 * <form.Field name="datetime">
 *   {(field) => (
 *     <DateTimePicker
 *       value={field.state.value}
 *       onChange={(date) => field.handleChange(date || new Date())}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export function DateTimePicker({
	value,
	onChange,
	className,
	disabled = false,
	placeholder = "MM/DD/YYYY HH:mm",
}: DateTimePickerProps) {
	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			const currentDate = value || new Date();
			const newDate = new Date(
				date.getFullYear(),
				date.getMonth(),
				date.getDate(),
				currentDate.getHours(),
				currentDate.getMinutes(),
			);
			onChange(newDate);
		}
	};

	const handleTimeChange = (type: "hour" | "minute", inputValue: string) => {
		const currentDate = value || new Date();
		const newDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			currentDate.getDate(),
			type === "hour" ? parseInt(inputValue, 10) : currentDate.getHours(),
			type === "minute" ? parseInt(inputValue, 10) : currentDate.getMinutes(),
		);

		onChange(newDate);
	};

	return (
		<Popover>
			<PopoverTrigger
				className={"w-full"}
				render={
					<Button
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full pl-3 text-left font-normal",
							!value && "text-muted-foreground",
							className,
						)}
					>
						{value ? format(value, "dd/MM/yyyy HH:mm") : placeholder}
						<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
					</Button>
				}
			/>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="sm:flex">
					<Calendar mode="single" selected={value} onSelect={handleDateSelect} initialFocus />
					<div className="flex flex-col divide-y sm:h-75 sm:flex-row sm:divide-x sm:divide-y-0">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{Array.from({ length: 24 }, (_, i) => i)
									.reverse()
									.map((hour) => (
										<Button
											key={hour}
											size="icon"
											variant={value && value.getHours() === hour ? "default" : "ghost"}
											className="aspect-square shrink-0 sm:w-full"
											onClick={() => handleTimeChange("hour", hour.toString())}
										>
											{hour}
										</Button>
									))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex p-2 sm:flex-col">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="icon"
										variant={value && value.getMinutes() === minute ? "default" : "ghost"}
										className="aspect-square shrink-0 sm:w-full"
										onClick={() => handleTimeChange("minute", minute.toString())}
									>
										{minute.toString().padStart(2, "0")}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
