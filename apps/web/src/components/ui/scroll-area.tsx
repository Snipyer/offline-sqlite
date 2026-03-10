"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: "vertical" | "horizontal";
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
	({ className, orientation = "vertical", children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"relative overflow-auto",
					orientation === "vertical" && "h-full",
					orientation === "horizontal" && "w-full",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	},
);
ScrollArea.displayName = "ScrollArea";

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: "vertical" | "horizontal";
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
	({ className, orientation = "vertical", ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"flex touch-none transition-colors select-none",
					orientation === "vertical" && "h-full w-2 border-l border-l-transparent p-px",
					orientation === "horizontal" && "h-2 border-t border-t-transparent p-px",
					className,
				)}
				{...props}
			>
				<div
					className={cn(
						"bg-foreground/20 rounded-full",
						orientation === "vertical" && "w-full",
						orientation === "horizontal" && "h-full",
					)}
				/>
			</div>
		);
	},
);
ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };
