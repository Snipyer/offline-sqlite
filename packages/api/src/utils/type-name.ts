export function capitalizeTypeName(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

export function normalizeTypeNames(rawName: string): string[] {
	return rawName
		.split("+")
		.map((name) => capitalizeTypeName(name))
		.filter((name) => name.length > 0);
}

export function capitalizeTypeNameOptional(name: string | null | undefined): string | null {
	if (name == null) {
		return null;
	}

	const normalized = capitalizeTypeName(name);
	return normalized.length > 0 ? normalized : null;
}
