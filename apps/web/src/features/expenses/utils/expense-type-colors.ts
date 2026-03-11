function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

function componentToHex(c: number): string {
	return c.toString(16).padStart(2, "0");
}

/**
 * Generate a consistent color for an expense type based on its ID.
 * Uses the same hash-based approach as visit colors.
 */
export function getExpenseTypeColor(expenseTypeId: string): string {
	const hash = hashString(expenseTypeId);
	const r = (hash >> 16) & 255;
	const g = (hash >> 8) & 255;
	const b = hash & 255;
	return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}
