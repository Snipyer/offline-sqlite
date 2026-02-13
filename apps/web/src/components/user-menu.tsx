import { Link, useNavigate } from "react-router";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@offline-sqlite/i18n";
import { useSidebar } from "@/components/ui/sidebar";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { User } from "lucide-react";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const { t, i18n } = useTranslation();
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	if (isPending) {
		return <Skeleton className={isCollapsed ? "size-8 rounded-full" : "h-9 w-24 rounded-lg"} />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<Button variant="outline" size={isCollapsed ? "icon-sm" : "sm"}>
					{isCollapsed ? <User className="size-4" /> : t("auth.signIn")}
				</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size={isCollapsed ? "xs" : "sm"}
						className={isCollapsed ? "w-full justify-center" : ""}
					/>
				}
			>
				{isCollapsed ? (
					<User className="size-4" />
				) : (
					<>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="me-1.5 size-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						{session.user.name}
					</>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card" align="end">
				<div className="px-2 py-1.5 text-sm font-semibold">{t("user.myAccount")}</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-default">{session.user.email}</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								headers: {
									"x-locale": i18n.resolvedLanguage ?? i18n.language,
								},
								onSuccess: () => {
									navigate("/");
								},
							},
						});
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="me-1.5 size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
						<polyline points="16 17 21 12 16 7" />
						<line x1="21" x2="9" y1="12" y2="12" />
					</svg>
					{t("auth.signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
