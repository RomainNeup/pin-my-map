import axios from 'axios';
import { env } from '$env/dynamic/public';
import { accessToken } from '$lib/stores/user';
import { toast } from '$lib/stores/toast';

export const axiosInstance = axios.create({
	baseURL: env.PUBLIC_API_BASE_URL,
	headers: {
		'Content-Type': 'application/json'
	}
});

accessToken.subscribe((token) => {
	if (token) {
		axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	} else {
		delete axiosInstance.defaults.headers.common['Authorization'];
	}
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
