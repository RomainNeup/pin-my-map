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
		if (error.response?.status === 401) {
			accessToken.set(null);
		}
		if (!isAuthRoute) {
			const message = error.response?.data?.message || error.message || 'An error occurred';
			toast(message, 'error');
		}
		return Promise.reject(error);
	}
);
