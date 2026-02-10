import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";
import { i18n, useTranslation } from "@offline-sqlite/i18n";

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
	return [{ title: i18n.t("meta.title") }, { name: "description", content: i18n.t("meta.description") }];
}

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { t } = useTranslation();

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{t("home.titleAscii")}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">{t("status.apiTitle")}</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full
								${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">
							{healthCheck.isLoading
								? t("status.checking")
								: healthCheck.data
									? t("status.connected")
									: t("status.disconnected")}
						</span>
					</div>
				</section>
			</div>
		</div>
	);
}
