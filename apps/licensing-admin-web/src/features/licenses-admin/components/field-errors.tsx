import { getValidationErrorMessage } from "../utils";

export function FieldErrors({ errors }: { errors: unknown[] }) {
	if (!errors.length) {
		return null;
	}

	return errors.map((error, index) => (
		<p key={`${index}-${getValidationErrorMessage(error)}`} className="text-destructive text-xs">
			{getValidationErrorMessage(error)}
		</p>
	));
}
