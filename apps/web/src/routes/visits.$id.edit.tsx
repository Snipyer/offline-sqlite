import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import VisitForm from "@/features/visits/components/visit-form";
import { trpc } from "@/utils/trpc";
import { useTranslation } from "@offline-sqlite/i18n";
import Loader from "@/components/loader";
import { AuthGuard } from "@/components/auth-guard";

export default function EditVisitPage() {
	return (
		<AuthGuard>
			<EditVisitContent />
		</AuthGuard>
	);
}

function EditVisitContent() {
	const { id } = useParams();
	const { t } = useTranslation();
	const visitQuery = useQuery(trpc.visit.getById.queryOptions({ id: id! }));

	if (visitQuery.isLoading) {
		return <Loader />;
	}

	if (!visitQuery.data) {
		return (
			<div className="container mx-auto py-8">
				<h1>{t("visits.visitNotFound")}</h1>
			</div>
		);
	}

	return <VisitForm mode="edit" visit={visitQuery.data} />;
}
