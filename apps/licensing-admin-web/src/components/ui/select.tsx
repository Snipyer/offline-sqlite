import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			className={cn(
				`border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-none
				border bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:ring-1
				disabled:cursor-not-allowed disabled:opacity-50`,
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}

export { Select };
