import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type UserRole = 'user' | 'admin';

export interface CurrentUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}

let accessTokenFromStorage: string | null = null;
let userLocationFromStorage: GeolocationPosition | null = null;

if (browser) {
	accessTokenFromStorage = localStorage.getItem('accessToken');
	const userLocationString = localStorage.getItem('userLocation');
	if (userLocationString) {
		try {
			userLocationFromStorage = JSON.parse(userLocationString);
		} catch {
			localStorage.removeItem('userLocation');
		}
	}
}

export const accessToken = writable<string | null>(accessTokenFromStorage);
export const userLocation = writable<GeolocationPosition | null>(userLocationFromStorage);
export const currentUser = writable<CurrentUser | null>(null);
export const isAdmin = derived(currentUser, ($u) => $u?.role === 'admin');

if (browser) {
	accessToken.subscribe((value) => {
		if (!browser) return;
		if (value === null) {
			localStorage.removeItem('accessToken');
			currentUser.set(null);
		} else {
			localStorage.setItem('accessToken', value);
		}
	});

	userLocation.subscribe((value) => {
		if (!browser) return;
		if (value === null) localStorage.removeItem('userLocation');
		else localStorage.setItem('userLocation', JSON.stringify(value));
	});
}
