import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { LicenseAction, LicenseRecord } from "../types";

type LicensesTableCardProps = {
	licenses: LicenseRecord[];
	busy: boolean;
	onRunAction: (id: string, action: LicenseAction) => Promise<void>;
};

export function LicensesTableCard({ licenses, busy, onRunAction }: LicensesTableCardProps) {
	const [search, setSearch] = useState("");
	const [planFilter, setPlanFilter] = useState<"all" | "perpetual" | "subscription">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
	const [copiedLicenseId, setCopiedLicenseId] = useState<string | null>(null);

	async function handleCopyLicense(licenseId: string, licenseKey: string | undefined) {
		if (!licenseKey) return;
		try {
			await navigator.clipboard.writeText(licenseKey);
			setCopiedLicenseId(licenseId);
			window.setTimeout(() => {
				setCopiedLicenseId((current) => (current === licenseId ? null : current));
			}, 1600);
		} catch {
			setCopiedLicenseId(null);
		}
	}

	const filteredLicenses = useMemo(() => {
		const lowered = search.trim().toLowerCase();
		return licenses.filter((license) => {
			const matchSearch =
				!lowered ||
				license.id.toLowerCase().includes(lowered) ||
				license.email.toLowerCase().includes(lowered) ||
				license.plan.toLowerCase().includes(lowered);
			const matchPlan = planFilter === "all" || license.plan === planFilter;
			const matchStatus =
				statusFilter === "all" ||
				(statusFilter === "active" ? !license.isRevoked : license.isRevoked);
			return matchSearch && matchPlan && matchStatus;
		});
	}, [licenses, planFilter, search, statusFilter]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Licenses</CardTitle>
				<CardDescription>Search and filter records before running actions.</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="grid gap-3 md:grid-cols-3">
					<div className="grid gap-2">
						<Label htmlFor="license-search">Search</Label>
						<Input
							id="license-search"
							placeholder="Search by ID, email or plan"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="plan-filter">Plan filter</Label>
						<Select
							id="plan-filter"
							value={planFilter}
							onChange={(event) =>
								setPlanFilter(event.target.value as "all" | "perpetual" | "subscription")
							}
						>
							<option value="all">All plans</option>
							<option value="perpetual">Perpetual</option>
							<option value="subscription">Subscription</option>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="status-filter">Status filter</Label>
						<Select
							id="status-filter"
							value={statusFilter}
							onChange={(event) =>
								setStatusFilter(event.target.value as "all" | "active" | "revoked")
							}
						>
							<option value="all">All statuses</option>
							<option value="active">Active</option>
							<option value="revoked">Revoked</option>
						</Select>
					</div>
				</div>

				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Expires</TableHead>
							<TableHead>Transfers</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredLicenses.map((license) => (
							<TableRow key={license.id}>
								<TableCell className="font-medium">{license.id}</TableCell>
								<TableCell>{license.email}</TableCell>
								<TableCell className="capitalize">{license.plan}</TableCell>
								<TableCell>
									<Badge
										className={license.isRevoked ? "text-destructive" : "text-foreground"}
									>
										{license.isRevoked ? "Revoked" : "Active"}
									</Badge>
								</TableCell>
								<TableCell>{new Date(license.createdAt).toLocaleString()}</TableCell>
								<TableCell>
									{license.expiresAt ? new Date(license.expiresAt).toLocaleString() : "-"}
								</TableCell>
								<TableCell>{license.maxTransfers ?? "-"}</TableCell>
								<TableCell>
									<div className="relative flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												void handleCopyLicense(license.id, license.keyPayload)
											}
											disabled={busy || !license.keyPayload}
											aria-label="Copy license"
											title="Copy license"
										>
											<Copy className="size-3.5" />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => void onRunAction(license.id, "reset")}
											disabled={busy}
										>
											Reset
										</Button>
										<Button
											type="button"
											variant="destructive"
											size="sm"
											onClick={() => void onRunAction(license.id, "revoke")}
											disabled={busy || license.isRevoked}
										>
											Revoke
										</Button>
										{copiedLicenseId === license.id ? (
											<span
												className="bg-popover text-popover-foreground border-border
													absolute -top-7 left-0 inline-flex items-center gap-1
													border px-2 py-1 text-[10px]"
											>
												<Check className="size-3" />
												Copied to clipboard
											</span>
										) : null}
									</div>
								</TableCell>
							</TableRow>
						))}
						{filteredLicenses.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="text-muted-foreground text-center">
									No licenses match your filters.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
