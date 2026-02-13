import { NavLink, useLocation } from "react-router";
import { Home, LayoutDashboard, MapPin, Waypoints } from "lucide-react";

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
	SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import LanguageSwitcher from "./language-switcher";
import UserMenu from "./user-menu";
import { isTauri } from "@/utils/is-tauri";

const navItems = [
	{ to: "/", labelKey: "nav.home", icon: Home },
	{ to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
	{ to: "/visits", labelKey: "nav.visits", icon: MapPin },
	{ to: "/visit-types", labelKey: "nav.visitTypes", icon: Waypoints },
] as const;

export function AppSidebar() {
	const { t } = useTranslation();
	const location = useLocation();
	const { state, side } = useSidebar();
	const isRtl = side === "right";

	return (
		<Sidebar collapsible="icon" side={side} dir={isRtl ? "rtl" : "ltr"} className={isTauri() ? "pt-9" : ""}>
			<SidebarHeader>
				<SidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive =
									item.to === "/"
										? location.pathname === "/"
										: location.pathname.startsWith(item.to);
								const Icon = item.icon;

								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton isActive={isActive} tooltip={t(item.labelKey)}>
											<NavLink to={item.to} className="flex w-full items-center gap-2">
												<Icon />
												<span>{t(item.labelKey)}</span>
											</NavLink>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter
				className="flex flex-row items-center justify-between gap-2 px-2
					group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-start
					group-data-[collapsible=icon]:px-0"
			>
				<div className="group-data-[collapsible=icon]:mt-auto">
					<UserMenu />
				</div>
				<div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
					<LanguageSwitcher />
					<ModeToggle />
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
