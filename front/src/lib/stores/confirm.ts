import { writable } from 'svelte/store';

export interface ConfirmOptions {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: 'accent' | 'danger';
}

export interface ConfirmRequest extends ConfirmOptions {
	id: string;
	resolve: (value: boolean) => void;
}

export const confirmRequest = writable<ConfirmRequest | null>(null);

export function confirm(opts: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => {
		const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		confirmRequest.set({
			id,
			resolve,
			confirmLabel: 'Confirm',
			cancelLabel: 'Cancel',
			tone: 'accent',
			...opts
		});
	});
}

export function resolveConfirm(id: string, value: boolean) {
	confirmRequest.update((req) => {
		if (req && req.id === id) {
			req.resolve(value);
			return null;
		}
		return req;
	});
}
