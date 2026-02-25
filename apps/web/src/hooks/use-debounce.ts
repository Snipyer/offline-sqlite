import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounce<T>(value: T, delay = 500): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function useDebouncedCallback<TArgs extends unknown[]>(
	callback: (...args: TArgs) => void,
	delay = 500,
) {
	const callbackRef = useRef(callback);
	const timeoutRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== undefined) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return useCallback(
		(...args: TArgs) => {
			if (timeoutRef.current !== undefined) {
				window.clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = window.setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	);
}
