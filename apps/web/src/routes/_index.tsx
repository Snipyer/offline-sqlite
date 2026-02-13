import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { i18n, useTranslation } from "@offline-sqlite/i18n";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
	return [{ title: i18n.t("meta.title") }, { name: "description", content: i18n.t("meta.description") }];
}

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { t } = useTranslation();

	return (
		<div className="container mx-auto max-w-3xl px-4 py-6">
			<pre className="text-muted-foreground mb-6 overflow-x-auto font-mono text-xs">
				{t("home.titleAscii")}
			</pre>
			<div className="grid gap-4">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-lg ${
									healthCheck.data ? "bg-green-500/10" : "bg-red-500/10"
								}`}
							>
								<div
									className={`h-3 w-3 rounded-full ${
										healthCheck.data ? "bg-green-500" : "bg-red-500"
									}`}
								/>
							</div>
							<div>
								<CardTitle>{t("status.apiTitle")}</CardTitle>
								<CardDescription>
									{healthCheck.isLoading
										? t("status.checking")
										: healthCheck.data
											? t("status.connected")
											: t("status.disconnected")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
				</Card>
			</div>
		</div>
	);
}
