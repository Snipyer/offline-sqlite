import type { ElementType, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	icon: ElementType;
	title: string;
	value: ReactNode;
	subtitle: ReactNode;
	color: "emerald" | "blue" | "violet" | "amber";
}

export function StatCard({ icon: Icon, title, value, subtitle, color }: StatCardProps) {
	const colorStyles = {
		emerald: {
			bg: "bg-emerald-500/10",
			icon: "text-emerald-500",
		},
		blue: {
			bg: "bg-blue-500/10",
			icon: "text-blue-500",
		},
		violet: {
			bg: "bg-violet-500/10",
			icon: "text-violet-500",
		},
		amber: {
			bg: "bg-amber-500/10",
			icon: "text-amber-500",
		},
	};

	const styles = colorStyles[color];

	return (
		<Card
			className="border-border/50 hover:border-border group relative overflow-hidden transition-all
				duration-300 hover:shadow-sm"
		>
			<div
				className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent
					to-transparent opacity-0 transition-opacity group-hover:opacity-100"
			/>
			<CardHeader className="relative flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
					{title}
				</CardTitle>
				<div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", styles.bg)}>
					<Icon className={cn("h-4 w-4", styles.icon)} />
				</div>
			</CardHeader>
			<CardContent className="relative">
				<div className="text-3xl font-bold tracking-tight">{value}</div>
				<div className="text-muted-foreground mt-1 text-xs">{subtitle}</div>
			</CardContent>
		</Card>
	);
}
