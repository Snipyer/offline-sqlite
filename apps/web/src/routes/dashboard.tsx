import { motion } from "motion/react";
import { User, Stethoscope, Users, CreditCard } from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

export default function Dashboard() {
	const { session, isPending } = useAuthGuard();
	const { t } = useTranslation();

	if (isPending) {
		return (
			<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
				<div className="relative">
					<div className="bg-primary/5 absolute inset-0 rounded-full blur-3xl" />
					<div
						className="border-primary/30 border-t-primary h-8 w-8 animate-spin rounded-full
							border-2"
					/>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="container mx-auto max-w-5xl px-4 py-8"
		>
			{/* Header */}
			<motion.div variants={itemVariants} className="mb-10">
				<div className="flex items-center gap-4">
					<div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
						<User className="text-primary h-7 w-7" />
					</div>
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
						<p className="text-muted-foreground mt-1">
							{t("dashboard.welcome", { name: session?.user.name })}
						</p>
					</div>
				</div>
			</motion.div>

			{/* Quick Stats Grid */}
			<div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<QuickStatCard
					icon={User}
					title={t("user.account")}
					subtitle={session?.user.email}
					color="blue"
					delay={0}
				/>
				<QuickStatCard
					icon={Stethoscope}
					title={t("nav.visits")}
					subtitle={t("dashboard.manageVisits")}
					color="emerald"
					delay={1}
				/>
				<QuickStatCard
					icon={Users}
					title={t("nav.patients")}
					subtitle={t("dashboard.managePatients")}
					color="violet"
					delay={2}
				/>
				<QuickStatCard
					icon={CreditCard}
					title={t("nav.payments")}
					subtitle={t("dashboard.viewPayments")}
					color="amber"
					delay={3}
				/>
			</div>
		</motion.div>
	);
}

function QuickStatCard({
	icon: Icon,
	title,
	subtitle,
	color,
	delay,
}: {
	icon: React.ElementType;
	title: string;
	subtitle?: string;
	color: "blue" | "emerald" | "violet" | "amber";
	delay: number;
}) {
	const colorStyles = {
		blue: {
			bg: "bg-blue-500/10",
			icon: "text-blue-500",
			gradient: "from-blue-500/5",
		},
		emerald: {
			bg: "bg-emerald-500/10",
			icon: "text-emerald-500",
			gradient: "from-emerald-500/5",
		},
		violet: {
			bg: "bg-violet-500/10",
			icon: "text-violet-500",
			gradient: "from-violet-500/5",
		},
		amber: {
			bg: "bg-amber-500/10",
			icon: "text-amber-500",
			gradient: "from-amber-500/5",
		},
	};

	const styles = colorStyles[color];

	return (
		<motion.div variants={itemVariants} transition={{ delay: delay * 0.05 }}>
			<Card
				className="border-border/50 hover:border-border group relative overflow-hidden transition-all
					duration-300 hover:shadow-sm"
			>
				<div
					className={cn(
						`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300
						group-hover:opacity-100`,
						styles.gradient,
						"to-transparent",
					)}
				/>
				<CardContent className="relative p-5">
					<div className="flex items-start gap-4">
						<div
							className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.bg)}
						>
							<Icon className={cn("h-5 w-5", styles.icon)} />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="font-semibold">{title}</h3>
							{subtitle && (
								<p className="text-muted-foreground mt-0.5 truncate text-sm">{subtitle}</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
