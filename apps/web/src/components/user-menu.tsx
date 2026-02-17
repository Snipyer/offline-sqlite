import { Link, useNavigate } from "react-router";
import { User, LogOut } from "lucide-react";

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
import { cn } from "@/lib/utils";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const { t, i18n } = useTranslation();
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	if (isPending) {
		return <Skeleton className={cn(isCollapsed ? "size-9 rounded-xl" : "h-9 w-full rounded-xl")} />;
	}

	if (!session) {
		return (
			<Link to="/login" className="block w-full">
				<Button
					variant="outline"
					size="icon"
					className="border-border/50 bg-background/50 hover:border-border hover:bg-muted h-9 w-9
						rounded-xl"
				>
					<User className="h-4 w-4" />
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
						size={isCollapsed ? "icon" : "default"}
						className={cn(
							`border-border/50 bg-background/50 hover:border-border hover:bg-muted
							transition-all duration-200`,
							isCollapsed
								? "h-9 w-9 rounded-xl"
								: "h-9 w-full justify-start gap-2 rounded-xl px-3 pl-0",
						)}
					>
						{isCollapsed ? (
							<span
								className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center
									rounded-lg text-xs font-semibold"
							>
								{session.user.name.charAt(0).toUpperCase()}
							</span>
						) : (
							<>
								<div
									className="bg-primary/10 flex h-9 w-9 items-center justify-center
										rounded-lg"
								>
									<span className="text-primary text-xs font-semibold">
										{session.user.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<span className="flex-1 truncate text-xs">{session.user.name}</span>
							</>
						)}
					</Button>
				}
			/>
			<DropdownMenuContent className="w-56" align="start" side="right">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium">{session.user.name}</p>
							<p className="text-muted-foreground text-xs">{session.user.email}</p>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
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
					className="cursor-pointer"
				>
					<LogOut className="mr-2 h-4 w-4" />
					{t("auth.signOut")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
