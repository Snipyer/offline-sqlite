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

export function getVisitColor(id: string): string {
	const hash = hashString(id);
	const r = (hash >> 16) & 255;
	const g = (hash >> 8) & 255;
	const b = hash & 255;
	return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}
