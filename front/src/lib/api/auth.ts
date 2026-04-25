import { accessToken, currentUser, type CurrentUser } from '$lib/stores/user';
import { axiosInstance } from './base';

export function login(email: string, password: string) {
	return axiosInstance.post('/auth/login', { email, password }).then((response) => {
		const token = response.data.accessToken;

		accessToken.set(token);

		return response;
	});
}

export function register(name: string, email: string, password: string) {
	return axiosInstance.post('/auth/register', { name, email, password });
}

export function getMe(): Promise<CurrentUser> {
	return axiosInstance.get<CurrentUser>('/auth/me').then(({ data }) => {
		currentUser.set(data);
		return data;
	});
}

export function forgotPassword(email: string) {
	return axiosInstance.post('/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string) {
	return axiosInstance.post('/auth/reset-password', { token, newPassword });
}
