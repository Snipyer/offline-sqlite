import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
	return <label className={cn("text-xs leading-none font-medium", className)} {...props} />;
}

export { Label };
