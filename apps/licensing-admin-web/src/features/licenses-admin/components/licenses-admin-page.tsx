import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchLicenses, getLicensingAdminApiKey, getLicensingAdminEndpoint, runLicenseAction } from "../api";
import type { LicenseAction, LicenseRecord } from "../types";
import { CreateLicenseCard } from "./create-license-card";
import { LicensesTableCard } from "./licenses-table-card";

export default function LicensesAdminPage() {
	const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("Ready");
	const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);

	const endpoint = useMemo(() => getLicensingAdminEndpoint(), []);
	const adminApiKey = useMemo(() => getLicensingAdminApiKey(), []);

	async function refreshLicenses() {
		setBusy(true);
		try {
			const records = await fetchLicenses(endpoint, adminApiKey);
			setLicenses(records);
			setMessage(`Loaded ${records.length} licenses`);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Load failed");
		} finally {
			setBusy(false);
		}
	}

	useEffect(() => {
		void refreshLicenses();
	}, []);

	async function handleRunAction(id: string, action: LicenseAction) {
		setBusy(true);
		try {
			await runLicenseAction(endpoint, adminApiKey, id, action);
			setMessage(`Action ${action} completed for ${id}`);
			const records = await fetchLicenses(endpoint, adminApiKey);
			setLicenses(records);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Action failed");
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="mx-auto grid w-full max-w-7xl gap-6 p-4 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Licensing Admin</CardTitle>
					<CardDescription>Create, review and manage license records.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-xs">{message}</p>
				</CardContent>
			</Card>

			<CreateLicenseCard
				endpoint={endpoint}
				adminApiKey={adminApiKey}
				busy={busy}
				isFormVisible={isCreateFormVisible}
				onToggleForm={() => setIsCreateFormVisible((current) => !current)}
				onRefresh={refreshLicenses}
				onCreated={refreshLicenses}
				onMessage={setMessage}
			/>

			<LicensesTableCard licenses={licenses} busy={busy} onRunAction={handleRunAction} />
		</main>
	);
}
