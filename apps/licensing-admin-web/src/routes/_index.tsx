import { adminEnv } from "@offline-sqlite/env/admin-web";
import { i18n, useTranslation } from "@offline-sqlite/i18n";
import { useEffect, useMemo, useState } from "react";

type LicenseRecord = {
	id: string;
	email: string;
	plan: string;
	createdAt: string;
	expiresAt: string | null;
	isRevoked: boolean;
	maxTransfers: number | null;
};

type CreateForm = {
	id: string;
	email: string;
	plan: "perpetual" | "subscription";
	key_payload: string;
	expires_at: string;
	max_transfers: number;
	generated_output: string;
};

type GeneratedLicensePayload = {
	id?: string;
	email?: string;
	plan?: "perpetual" | "subscription";
	created_at?: string;
	expires_at?: string | null;
	max_transfers?: number;
};

const pageStyle: React.CSSProperties = {
	maxWidth: "1100px",
	margin: "24px auto",
	padding: "16px",
	display: "grid",
	gap: "16px",
};

const cardStyle: React.CSSProperties = {
	background: "white",
	padding: "16px",
	borderRadius: "10px",
	border: "1px solid #e2e8f0",
};

const rowStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px",
};

function getApiBaseUrl() {
	return adminEnv.VITE_LICENSING_ADMIN_API_URL ?? window.location.origin;
}

function getAdminApiKey() {
	return adminEnv.VITE_LICENSING_ADMIN_API_KEY?.trim() || "";
}

function extractLicenseFromGeneratorOutput(rawOutput: string): {
	payload: GeneratedLicensePayload;
	licenseKey: string;
} {
	const payloadBlockMatch = rawOutput.match(/Payload:\s*([\s\S]*?)\s*License Key:/i);
	if (!payloadBlockMatch?.[1]) {
		throw new Error(i18n.t("licensingAdmin.status.invalidPastedOutput"));
	}

	let payload: GeneratedLicensePayload;
	try {
		payload = JSON.parse(payloadBlockMatch[1].trim()) as GeneratedLicensePayload;
	} catch {
		throw new Error(i18n.t("licensingAdmin.status.invalidPayloadJson"));
	}

	const licenseKeyMatch = rawOutput.match(/License Key:\s*(LKEY-[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i);
	if (!licenseKeyMatch?.[1]) {
		throw new Error(i18n.t("licensingAdmin.status.invalidLicenseKey"));
	}

	return {
		payload,
		licenseKey: licenseKeyMatch[1],
	};
}

export default function LicensingAdminPage() {
	const { t } = useTranslation();
	const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string>(t("licensingAdmin.status.ready"));
	const [form, setForm] = useState<CreateForm>({
		id: "",
		email: "",
		plan: "perpetual",
		key_payload: "",
		expires_at: "",
		max_transfers: 3,
		generated_output: "",
	});

	const endpoint = useMemo(() => `${getApiBaseUrl()}/api/admin`, []);
	const adminApiKey = useMemo(() => getAdminApiKey(), []);
	const hasGeneratedOutput = form.generated_output.trim().length > 0;

	async function adminFetch(path: string, init?: RequestInit) {
		const headers = new Headers(init?.headers);
		headers.set("content-type", "application/json");
		if (adminApiKey) {
			headers.set("x-admin-api-key", adminApiKey);
		}

		const response = await fetch(`${endpoint}${path}`, {
			credentials: "include",
			headers,
			...init,
		});
		const payload = (await response.json().catch(() => ({}))) as { error?: string };
		if (!response.ok) {
			throw new Error(payload.error || t("licensingAdmin.status.requestFailed"));
		}
		return payload;
	}

	async function loadLicenses() {
		setBusy(true);
		try {
			const records = (await adminFetch("/licenses", { method: "GET" })) as LicenseRecord[];
			setLicenses(records);
			setMessage(
				i18n.t("licensingAdmin.status.loaded", {
					count: records.length,
				}),
			);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : t("licensingAdmin.status.loadFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function createLicense(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		try {
			const generatedOutput = form.generated_output.trim();
			let valuesToSubmit = {
				id: form.id,
				email: form.email,
				plan: form.plan,
				key_payload: form.key_payload,
				expires_at: form.expires_at,
				max_transfers: form.max_transfers,
				created_at: new Date().toISOString(),
			};

			if (generatedOutput) {
				const { payload, licenseKey } = extractLicenseFromGeneratorOutput(generatedOutput);

				if (!payload.id || !payload.email || !payload.plan || !payload.created_at) {
					throw new Error(i18n.t("licensingAdmin.status.missingPayloadFields"));
				}

				valuesToSubmit = {
					id: payload.id,
					email: payload.email,
					plan: payload.plan,
					key_payload: licenseKey,
					expires_at: payload.expires_at ?? "",
					max_transfers: payload.max_transfers ?? 3,
					created_at: payload.created_at,
				};

				setForm((current) => ({
					...current,
					id: payload.id ?? current.id,
					email: payload.email ?? current.email,
					plan: payload.plan ?? current.plan,
					key_payload: licenseKey,
					expires_at: payload.expires_at ?? "",
					max_transfers: payload.max_transfers ?? 3,
				}));
			}

			await adminFetch("/licenses", {
				method: "POST",
				body: JSON.stringify({
					id: valuesToSubmit.id,
					email: valuesToSubmit.email,
					plan: valuesToSubmit.plan,
					key_payload: valuesToSubmit.key_payload,
					created_at: valuesToSubmit.created_at,
					expires_at: valuesToSubmit.expires_at || null,
					max_transfers: valuesToSubmit.max_transfers,
				}),
			});
			setMessage(t("licensingAdmin.status.created"));
			setForm({
				id: "",
				email: "",
				plan: "perpetual",
				key_payload: "",
				expires_at: "",
				max_transfers: 3,
				generated_output: "",
			});
			await loadLicenses();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : t("licensingAdmin.status.createFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function runAction(id: string, action: "reset" | "revoke") {
		setBusy(true);
		try {
			await adminFetch(`/licenses/${id}/${action}`, { method: "POST" });
			setMessage(i18n.t("licensingAdmin.status.actionDone", { id, action }));
			await loadLicenses();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : t("licensingAdmin.status.actionFailed"));
		} finally {
			setBusy(false);
		}
	}

	useEffect(() => {
		void loadLicenses();
	}, []);

	return (
		<main style={pageStyle}>
			<section style={cardStyle}>
				<h1>{t("licensingAdmin.title")}</h1>
				<p>{t("licensingAdmin.subtitle")}</p>
				<p>{message}</p>
			</section>

			<section style={cardStyle}>
				<h2>{t("licensingAdmin.create.title")}</h2>
				<form onSubmit={createLicense} style={{ display: "grid", gap: "10px" }}>
					<textarea
						placeholder={t("licensingAdmin.create.generatorOutput")}
						value={form.generated_output}
						onChange={(event) => {
							const value = (event.target as HTMLTextAreaElement).value;
							setForm((current) => ({ ...current, generated_output: value }));
						}}
						rows={8}
					/>
					<div style={rowStyle}>
						<input
							placeholder={t("licensingAdmin.create.id")}
							value={form.id}
							onChange={(event) => {
								const value = (event.target as HTMLInputElement).value;
								setForm((current) => ({ ...current, id: value }));
							}}
							required={!hasGeneratedOutput}
						/>
						<input
							type="email"
							placeholder={t("licensingAdmin.create.email")}
							value={form.email}
							onChange={(event) => {
								const value = (event.target as HTMLInputElement).value;
								setForm((current) => ({ ...current, email: value }));
							}}
							required={!hasGeneratedOutput}
						/>
						<select
							value={form.plan}
							onChange={(event) => {
								const value = (event.target as HTMLSelectElement).value as CreateForm["plan"];
								setForm((current) => ({
									...current,
									plan: value,
								}));
							}}
						>
							<option value="perpetual">{t("licensingAdmin.plan.perpetual")}</option>
							<option value="subscription">{t("licensingAdmin.plan.subscription")}</option>
						</select>
					</div>
					<div style={rowStyle}>
						<input
							placeholder={t("licensingAdmin.create.keyPayload")}
							value={form.key_payload}
							onChange={(event) => {
								const value = (event.target as HTMLInputElement).value;
								setForm((current) => ({ ...current, key_payload: value }));
							}}
							required={!hasGeneratedOutput}
						/>
						<input
							placeholder={t("licensingAdmin.create.expiresAt")}
							value={form.expires_at}
							onChange={(event) => {
								const value = (event.target as HTMLInputElement).value;
								setForm((current) => ({ ...current, expires_at: value }));
							}}
						/>
						<input
							type="number"
							min={1}
							value={form.max_transfers}
							onChange={(event) => {
								const value = Number((event.target as HTMLInputElement).value);
								setForm((current) => ({
									...current,
									max_transfers: value,
								}));
							}}
						/>
					</div>
					<div style={{ display: "flex", gap: "8px" }}>
						<button type="submit" disabled={busy}>
							{t("licensingAdmin.create.submit")}
						</button>
						<button type="button" onClick={() => void loadLicenses()} disabled={busy}>
							{t("licensingAdmin.actions.refresh")}
						</button>
					</div>
				</form>
			</section>

			<section style={cardStyle}>
				<h2>{t("licensingAdmin.list.title")}</h2>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr>
							<th>{t("licensingAdmin.list.id")}</th>
							<th>{t("licensingAdmin.list.email")}</th>
							<th>{t("licensingAdmin.list.plan")}</th>
							<th>{t("licensingAdmin.list.revoked")}</th>
							<th>{t("licensingAdmin.list.actions")}</th>
						</tr>
					</thead>
					<tbody>
						{licenses.map((license) => (
							<tr key={license.id}>
								<td>{license.id}</td>
								<td>{license.email}</td>
								<td>{license.plan}</td>
								<td>
									{license.isRevoked
										? t("licensingAdmin.list.yes")
										: t("licensingAdmin.list.no")}
								</td>
								<td style={{ display: "flex", gap: "8px" }}>
									<button type="button" onClick={() => void runAction(license.id, "reset")}>
										{t("licensingAdmin.actions.reset")}
									</button>
									<button
										type="button"
										onClick={() => void runAction(license.id, "revoke")}
									>
										{t("licensingAdmin.actions.revoke")}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</main>
	);
}
