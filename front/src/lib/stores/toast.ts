import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface Toast {
	id: string;
	kind: ToastKind;
	message: string;
	duration: number;
	action?: ToastAction;
}

const defaultDuration: Record<ToastKind, number> = {
	success: 3000,
	info: 3500,
	warning: 5000,
	error: 6000
};

export const toasts = writable<Toast[]>([]);

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function toast(
	message: string,
	kind: ToastKind = 'info',
	opts: { duration?: number; action?: ToastAction } = {}
): string {
	const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
	const duration = opts.duration ?? (opts.action ? 8000 : defaultDuration[kind]);
	const item: Toast = { id, kind, message, duration, action: opts.action };

	toasts.update((list) => [...list, item]);

	if (duration > 0) {
		const handle = setTimeout(() => dismissToast(id), duration);
		timers.set(id, handle);
	}

	return id;
}

export function dismissToast(id: string): void {
	const handle = timers.get(id);
	if (handle) {
		clearTimeout(handle);
		timers.delete(id);
	}
	toasts.update((list) => list.filter((t) => t.id !== id));
}
