import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoaderProps = {
	className?: string;
	spinnerClassName?: string;
	showGlow?: boolean;
};

const defaultContainerClassName = "h-[calc(100vh-8rem)] pt-0";

export default function Loader({ className, spinnerClassName, showGlow = true }: LoaderProps) {
	return (
		<div
			className={cn("flex h-full items-center justify-center", className ?? defaultContainerClassName)}
		>
			<div className="relative">
				{showGlow ? <div className="bg-primary/5 absolute inset-0 rounded-full blur-3xl" /> : null}
				<Loader2
					className={cn(
						"relative animate-spin",
						showGlow ? "text-primary h-10 w-10" : undefined,
						spinnerClassName,
					)}
				/>
			</div>
		</div>
	);
}
