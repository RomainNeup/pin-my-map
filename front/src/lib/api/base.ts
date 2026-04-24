import axios from 'axios';
import { env } from '$env/dynamic/public';
import { get } from 'svelte/store';
import { accessToken } from '$lib/stores/user';
import { toast } from '$lib/stores/toast';

export const axiosInstance = axios.create({
	baseURL: env.PUBLIC_API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${get(accessToken)}`
	}
});

accessToken.subscribe((token) => {
	axiosInstance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
});

axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			accessToken.update(() => null);
		}
		const message = error.response?.data?.message || error.message || 'An error occurred';
		toast(message, 'error');
		return Promise.reject({ error: message, status: error.response?.status ?? 0 });
	}
);
