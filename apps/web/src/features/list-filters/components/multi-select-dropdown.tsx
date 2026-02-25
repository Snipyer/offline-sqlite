import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

interface MultiSelectDropdownOption {
	value: string;
	label: string;
}

interface MultiSelectDropdownProps {
	value: string[];
	onValueChange: (value: string[]) => void;
	options: MultiSelectDropdownOption[];
	placeholder: string;
}

export function MultiSelectDropdown({
	value,
	onValueChange,
	options,
	placeholder,
}: MultiSelectDropdownProps) {
	const selectedLabels = options
		.filter((option) => value.includes(option.value))
		.map((option) => option.label);

	const triggerLabel = selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="w-full">
				<Button
					variant="outline"
					className="mt-1.5 w-full justify-between px-3 text-left font-normal"
				>
					<span className="line-clamp-1">{triggerLabel}</span>
					<ChevronDownIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="max-h-72 w-(--anchor-width)">
				{options.map((option) => {
					const isChecked = value.includes(option.value);

					return (
						<DropdownMenuCheckboxItem
							key={option.value}
							checked={isChecked}
							onCheckedChange={(checked) => {
								if (checked) {
									onValueChange([...value, option.value]);
									return;
								}

								onValueChange(value.filter((selected) => selected !== option.value));
							}}
						>
							{option.label}
						</DropdownMenuCheckboxItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
