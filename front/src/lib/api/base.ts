import axios from 'axios';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { accessToken } from '$lib/stores/user';
import { toast } from '$lib/stores/toast';

export const axiosInstance = axios.create({
	baseURL: env.PUBLIC_API_BASE_URL,
	headers: {
		'Content-Type': 'application/json'
	}
});

if (browser) {
	accessToken.subscribe((token) => {
		if (token) {
			axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		} else {
			delete axiosInstance.defaults.headers.common['Authorization'];
		}
	});
}

const GAMIFICATION_TRIGGER_PATHS = [
	'/saved',
	'/place',
	'/suggestion',
	'/follow',
	'/comments'
];
let gamificationRefreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleGamificationRefresh(): void {
	if (gamificationRefreshTimer) clearTimeout(gamificationRefreshTimer);
	gamificationRefreshTimer = setTimeout(async () => {
		gamificationRefreshTimer = null;
		const { loadGamificationProfile } = await import('$lib/stores/gamification');
		loadGamificationProfile().catch(() => {});
	}, 250);
}

axiosInstance.interceptors.response.use(
	(response) => {
		const method = response.config.method?.toUpperCase();
		const url = response.config.url ?? '';
		if (method && method !== 'GET' && GAMIFICATION_TRIGGER_PATHS.some((p) => url.startsWith(p))) {
			scheduleGamificationRefresh();
		}
		return response;
	},
	(error) => {
		const url = error.config?.url ?? '';
		const isAuthRoute = url.startsWith('/login') || url.startsWith('/register');
		const status: number | undefined = error.response?.status;
		if (status === 401) {
			accessToken.set(null);
			if (browser && !isAuthRoute) {
				const here = window.location.pathname;
				if (!here.startsWith('/login') && !here.startsWith('/register') && !here.startsWith('/u/') && !here.startsWith('/public/')) {
					window.location.assign('/login');
				}
			}
		}
		if (!isAuthRoute) {
			const serverMessage = error.response?.data?.message;
			const fallback = status && status >= 500
				? 'Something went wrong on the server. Please try again.'
				: error.message || 'An error occurred';
			toast(serverMessage || fallback, 'error');
		}
		return Promise.reject(error);
	}
);
