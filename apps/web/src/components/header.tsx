import { NavLink } from "react-router";

import { useTranslation } from "@offline-sqlite/i18n";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
	const { t } = useTranslation();
	const links = [
		{ to: "/", label: t("nav.home") },
		{ to: "/dashboard", label: t("nav.dashboard") },
		{ to: "/visits", label: t("nav.visits") },
		{ to: "/visit-types", label: t("nav.visitTypes") },
	] as const;

	return (
		<header className="bg-card/50 supports-backdrop-filter:bg-card/60 border-b backdrop-blur-sm">
			<div className="container mx-auto flex flex-row items-center justify-between px-4 py-2">
				<nav className="flex gap-1">
					{links.map(({ to, label }) => {
						return (
							<NavLink
								key={to}
								to={to}
								className={({ isActive }) =>
									`rounded-none px-3 py-1.5 text-sm font-medium transition-colors ${isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`
								}
								end
							>
								{label}
							</NavLink>
						);
					})}
				</nav>
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
