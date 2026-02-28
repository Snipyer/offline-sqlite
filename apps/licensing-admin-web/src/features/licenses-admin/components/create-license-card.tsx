import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLicense } from "../api";
import { createLicenseSchema, extractLicenseFromGeneratorOutput } from "../utils";
import { FieldErrors } from "./field-errors";

type CreateLicenseCardProps = {
	endpoint: string;
	adminApiKey: string;
	busy: boolean;
	isFormVisible: boolean;
	onToggleForm: () => void;
	onRefresh: () => Promise<void>;
	onCreated: () => Promise<void>;
	onMessage: (value: string) => void;
};

export function CreateLicenseCard({
	endpoint,
	adminApiKey,
	busy,
	isFormVisible,
	onToggleForm,
	onRefresh,
	onCreated,
	onMessage,
}: CreateLicenseCardProps) {
	const form = useForm({
		defaultValues: {
			id: "",
			email: "",
			plan: "perpetual" as "perpetual" | "subscription",
			key_payload: "",
			expires_at: "",
			max_transfers: 3,
			generated_output: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const generatedOutput = value.generated_output.trim();
				let valuesToSubmit = {
					id: value.id,
					email: value.email,
					plan: value.plan,
					key_payload: value.key_payload,
					expires_at: value.expires_at,
					max_transfers: value.max_transfers,
					created_at: new Date().toISOString(),
				};

				if (generatedOutput) {
					const { payload, licenseKey } = extractLicenseFromGeneratorOutput(generatedOutput);
					if (!payload.id || !payload.email || !payload.plan || !payload.created_at) {
						throw new Error("Generator payload is missing required fields");
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
				}

				await createLicense(endpoint, adminApiKey, valuesToSubmit);
				onMessage("License created");
				form.reset();
				await onCreated();
			} catch (error) {
				onMessage(error instanceof Error ? error.message : "Create failed");
			}
		},
		validators: {
			onSubmit: createLicenseSchema,
		},
	});

	function syncFieldsFromGeneratedOutput(rawOutput: string) {
		const normalizedOutput = rawOutput.trim();
		if (!normalizedOutput) {
			return;
		}

		try {
			const { payload, licenseKey } = extractLicenseFromGeneratorOutput(normalizedOutput);
			if (!payload.id || !payload.email || !payload.plan) {
				return;
			}

			form.setFieldValue("id", payload.id);
			form.setFieldValue("email", payload.email);
			form.setFieldValue("plan", payload.plan);
			form.setFieldValue("key_payload", licenseKey);
			form.setFieldValue("expires_at", payload.expires_at ?? "");
			form.setFieldValue("max_transfers", payload.max_transfers ?? 3);
		} catch {
			return;
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<CardTitle>Create License</CardTitle>
					<CardDescription>
						Paste generator output or fill fields manually before creating a record.
					</CardDescription>
				</div>
				<div className="flex gap-2">
					<Button type="button" size="sm" variant="outline" onClick={onToggleForm}>
						{isFormVisible ? "Hide form" : "Show form"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => void onRefresh()}
						disabled={busy}
					>
						Refresh
					</Button>
				</div>
			</CardHeader>
			{isFormVisible ? (
				<CardContent>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void form.handleSubmit();
						}}
						className="grid gap-4"
					>
						<form.Field name="generated_output">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Generator output</Label>
									<Textarea
										id={field.name}
										name={field.name}
										rows={8}
										placeholder="Paste raw output from generate-license script"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											const nextValue = event.target.value;
											field.handleChange(nextValue);
											syncFieldsFromGeneratedOutput(nextValue);
										}}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid gap-4 md:grid-cols-3">
							<form.Field name="id">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>License ID</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="email">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="plan">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Plan</Label>
										<Select
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(
													event.target.value as "perpetual" | "subscription",
												)
											}
										>
											<option value="perpetual">Perpetual</option>
											<option value="subscription">Subscription</option>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<form.Field name="key_payload">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>License key payload</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="expires_at">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Expires at (optional)</Label>
										<Input
											id={field.name}
											name={field.name}
											placeholder="2027-12-31T00:00:00.000Z"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="max_transfers">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Max transfers</Label>
										<Input
											id={field.name}
											name={field.name}
											type="number"
											min={1}
											value={String(field.state.value)}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(Number(event.target.value || 1))
											}
										/>
										<FieldErrors errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</div>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									disabled={!state.canSubmit || state.isSubmitting || busy}
								>
									{state.isSubmitting ? "Creating..." : "Create license"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			) : null}
		</Card>
	);
}
