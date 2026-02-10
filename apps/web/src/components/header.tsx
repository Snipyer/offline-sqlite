import { NavLink } from "react-router";

import { LanguageSwitcher, useTranslation } from "@offline-sqlite/i18n";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const { t } = useTranslation();
	const links = [
		{ to: "/", label: t("nav.home") },
		{ to: "/dashboard", label: t("nav.dashboard") },
		{ to: "/todos", label: t("nav.todos") },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-2 py-1">
				<nav className="flex gap-4 text-lg">
					{links.map(({ to, label }) => {
						return (
							<NavLink
								key={to}
								to={to}
								className={({ isActive }) => (isActive ? "font-bold" : "")}
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
			<hr />
		</div>
	);
}
