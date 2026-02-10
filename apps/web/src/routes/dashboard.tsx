import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";

export default function Dashboard() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const privateData = useQuery(trpc.privateData.queryOptions());

	useEffect(() => {
		if (!session && !isPending) {
			navigate("/login");
		}
	}, [session, isPending, navigate]);

	if (isPending) {
		return <div>{t("dashboard.loading")}</div>;
	}

	return (
		<div>
			<h1>{t("dashboard.title")}</h1>
			<p>{t("dashboard.welcome", { name: session?.user.name })}</p>
			<p>{t("dashboard.api", { message: privateData.data?.message ?? "" })}</p>
		</div>
	);
}
