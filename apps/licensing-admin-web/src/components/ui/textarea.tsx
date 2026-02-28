import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(
				`border-input placeholder:text-muted-foreground focus-visible:border-ring
				focus-visible:ring-ring/50 min-h-24 w-full rounded-none border bg-transparent px-2.5 py-2
				text-xs outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50`,
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
