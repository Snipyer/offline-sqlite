import { useTranslation } from "@offline-sqlite/i18n";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthGuard } from "@/components/auth-guard";

export default function Dashboard() {
	const { session, isPending } = useAuthGuard();
	const { t } = useTranslation();

	if (isPending) {
		return null;
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6">
			<div className="mb-6">
				<h1 className="mb-1 text-2xl font-bold">{t("dashboard.title")}</h1>
				<p className="text-muted-foreground">
					{t("dashboard.welcome", { name: session?.user.name })}
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div
								className="bg-primary/10 flex h-10 w-10 items-center justify-center
									rounded-lg"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="text-primary size-5"
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
							</div>
							<div>
								<CardTitle className="text-base">{t("user.account")}</CardTitle>
								<CardDescription className="truncate">{session?.user.email}</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
