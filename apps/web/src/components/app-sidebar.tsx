import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import {
	Users,
	CreditCard,
	Calendar,
	CalendarDays,
	Syringe,
	Stethoscope,
	TrendingUp,
	Receipt,
} from "lucide-react";
import { useTranslation } from "@offline-sqlite/i18n";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import LanguageSwitcher from "./language-switcher";
import UserMenu from "./user-menu";
import { isTauri } from "@/utils/is-tauri";
import { cn } from "@/lib/utils";
import { env } from "@offline-sqlite/env/web";
import TrialBanner from "@/features/licensing/components/trial-banner";
import { useLicense } from "@/features/licensing/hooks/use-license";

const navItems = [
	{ to: "/daily-summary", labelKey: "nav.dailySummary", icon: Calendar },
	{ to: "/visits", labelKey: "nav.visits", icon: Stethoscope },
	{ to: "/patients", labelKey: "nav.patients", icon: Users },
	{ to: "/visit-types", labelKey: "nav.visitTypes", icon: Syringe },
	{ to: "/appointments", labelKey: "nav.appointments", icon: CalendarDays },
	{ to: "/payments", labelKey: "nav.payments", icon: CreditCard },
	{ to: "/expenses", labelKey: "nav.expenses", icon: Receipt },
	{ to: "/reports", labelKey: "nav.reports", icon: TrendingUp },
] as const;

const navGroups = [
	{
		labelKey: "nav.groupOverview",
		items: [navItems[0]],
	},
	{
		labelKey: "nav.groupClinic",
		items: [navItems[1], navItems[2], navItems[3], navItems[4]],
	},
	{
		labelKey: "nav.groupFinance",
		items: [navItems[5], navItems[6], navItems[7]],
	},
] as const;

const itemVariants = {
	hidden: { opacity: 0, x: -10 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: {
			delay: i * 0.05,
			duration: 0.3,
			ease: "easeOut" as const,
		},
	}),
};

export function AppSidebar() {
	const { t } = useTranslation();
	const location = useLocation();
	const { state, side } = useSidebar();
	const isRtl = side === "right";
	const isCollapsed = state === "collapsed";

	const isTauriEnv = isTauri();
	const { licenseState } = useLicense();

	const showTrialBanner = isTauriEnv && licenseState.state === "trial" && licenseState.days_remaining > 0;

	return (
		<Sidebar
			collapsible="icon"
			side={side}
			dir={isRtl ? "rtl" : "ltr"}
			className={cn(
				"border-border/50 from-background to-muted/20 border-r bg-linear-to-b",
				isTauri() && "pt-9",
			)}
		>
			<SidebarHeader className="border-border/50 border-b p-4">
				<div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
					{!isCollapsed && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex items-center gap-3"
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-xl">
								<img src="/square_tauri_icon.png" alt="Logo" className="h-10 w-10" />
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground text-xs">{t("common.welcomeTo")}</span>
								<span className="text-sm font-semibold">{env.VITE_APP_NAME}</span>
							</div>
						</motion.div>
					)}
					<SidebarTrigger className="hover:bg-muted h-8 w-8 rounded-lg transition-colors" />
				</div>
			</SidebarHeader>

			<SidebarContent className="">
				{showTrialBanner && (
					<TrialBanner
						isCollapsed={isCollapsed}
						daysRemaining={licenseState.state === "trial" ? licenseState.days_remaining : 0}
					/>
				)}
				{navGroups.map((group, groupIndex) => (
					<SidebarGroup key={group.labelKey}>
						<SidebarGroupLabel className="pl-3">{t(group.labelKey)}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-1">
								{group.items.map((item, itemIndex) => {
									const isActive = location.pathname.startsWith(item.to);
									const Icon = item.icon;
									const animationIndex = groupIndex * 10 + itemIndex;

									return (
										<motion.div
											key={item.to}
											custom={animationIndex}
											variants={itemVariants}
											initial="hidden"
											animate="visible"
										>
											<SidebarMenuItem>
												<SidebarMenuButton
													isActive={isActive}
													tooltip={t(item.labelKey)}
													className={cn(
														"relative h-10 transition-colors duration-200",
														isActive
															? "bg-primary/10 text-primary font-medium"
															: `text-muted-foreground hover:bg-muted
																hover:text-foreground`,
													)}
												>
													<NavLink
														to={item.to}
														className={cn(
															"flex w-full items-center",
															isCollapsed
																? "justify-center px-0"
																: "gap-3 px-2",
														)}
													>
														<div
															className={cn(
																`flex items-center justify-center rounded-lg
																transition-all duration-200`,
																isCollapsed ? "h-9 w-9" : "h-8 w-8",
																isActive ? "bg-primary/20" : "bg-muted",
																isCollapsed ? "bg-transparent" : "",
															)}
														>
															<Icon
																className={cn(
																	"transition-colors",
																	isCollapsed ? "h-5 w-5" : "h-4 w-4",
																	isActive
																		? "text-primary"
																		: "text-muted-foreground",
																)}
															/>
														</div>
														{!isCollapsed && (
															<span className="text-sm">
																{t(item.labelKey)}
															</span>
														)}
													</NavLink>

													{/* Active indicator line */}
													{isActive && (
														<motion.div
															layoutId="activeIndicator"
															className={cn(
																`bg-primary absolute top-1/2 h-6 w-1
																-translate-y-1/2 rounded-full`,
																isRtl ? "right-0" : "left-0",
															)}
															transition={{
																type: "spring",
																stiffness: 500,
																damping: 30,
															}}
														/>
													)}
												</SidebarMenuButton>
											</SidebarMenuItem>
										</motion.div>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter className="border-border/50 border-t p-3">
				<div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
					<div className={cn("", isCollapsed ? "w-auto" : "flex-1")}>
						<UserMenu />
					</div>
					<div className={cn("flex items-center gap-1", isCollapsed && "flex-col")}>
						<LanguageSwitcher />
						<ModeToggle />
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
