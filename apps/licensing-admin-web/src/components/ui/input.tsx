import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			className={cn(
				`border-input placeholder:text-muted-foreground focus-visible:border-ring
				focus-visible:ring-ring/50 flex h-8 w-full rounded-none border bg-transparent px-2.5 py-1
				text-xs outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50`,
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
