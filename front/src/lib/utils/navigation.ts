import { goto } from '$app/navigation';

export function goBack(fallback: string): void {
	if (typeof history !== 'undefined' && history.length > 1) {
		history.back();
	} else {
		goto(fallback);
	}
}
