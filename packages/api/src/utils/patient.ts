const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function capitalizePatientName(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

export function ageFromDateOfBirth(dateOfBirth: number): number {
	const dob = new Date(dateOfBirth);
	const today = new Date();
	return Math.max(0, Math.floor((today.getTime() - dob.getTime()) / MS_PER_YEAR));
}

export function dateOfBirthFromAge(age: number): Date {
	const today = new Date();
	const dob = new Date(today);
	dob.setFullYear(today.getFullYear() - age);
	return dob;
}
