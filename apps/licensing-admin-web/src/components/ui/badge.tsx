import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				`border-border inline-flex items-center border px-2 py-0.5 text-[10px] font-medium
				tracking-wide uppercase`,
				className,
			)}
			{...props}
		/>
	);
}

export { Badge };
