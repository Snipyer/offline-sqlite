function hasMessage(value: unknown): value is { message: string } {
	return (
		typeof value === "object" &&
		value !== null &&
		"message" in value &&
		typeof (value as { message?: unknown }).message === "string"
	);
}

function hasErrorMessage(value: unknown): value is { error: { message: string } } {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof (value as { error?: unknown }).error === "object" &&
		(value as { error?: unknown }).error !== null &&
		"message" in ((value as { error?: { message?: unknown } }).error ?? {}) &&
		typeof (value as { error?: { message?: unknown } }).error?.message === "string"
	);
}

export function toFormErrorMessage(value: unknown): string | null {
	if (typeof value === "string") {
		return value;
	}

	if (hasMessage(value)) {
		return value.message;
	}

	if (hasErrorMessage(value)) {
		return value.error.message;
	}

	if (value instanceof Error) {
		return value.message;
	}

	return null;
}

export function toFormErrorMessages(values: readonly unknown[]): string[] {
	return values
		.map((value) => toFormErrorMessage(value))
		.filter((value): value is string => Boolean(value));
}
