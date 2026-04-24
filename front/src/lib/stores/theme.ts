import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark' | 'system';

function readInitial(): ThemeMode {
	if (!browser) return 'system';
	const stored = localStorage.getItem('theme');
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'system';
}

function systemPrefersDark(): boolean {
	return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(mode: ThemeMode): 'light' | 'dark' {
	if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
	return mode;
}

function apply(resolved: 'light' | 'dark') {
	if (!browser) return;
	const el = document.documentElement;
	el.classList.toggle('dark', resolved === 'dark');
	el.style.colorScheme = resolved;
}

function createThemeStore() {
	const { subscribe, set } = writable<ThemeMode>(readInitial());

	if (browser) {
		// React to system preference changes when in 'system' mode
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', () => {
			const mode = readInitial();
			if (mode === 'system') apply(resolve(mode));
		});
	}

	return {
		subscribe,
		set(mode: ThemeMode) {
			if (browser) localStorage.setItem('theme', mode);
			apply(resolve(mode));
			set(mode);
		},
		toggle() {
			const current = readInitial();
			const resolved = resolve(current);
			this.set(resolved === 'dark' ? 'light' : 'dark');
		},
		resolved: (): 'light' | 'dark' => resolve(readInitial())
	};
}

export const theme = createThemeStore();
