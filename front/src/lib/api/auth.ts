import { accessToken, currentUser, type CurrentUser } from '$lib/stores/user';
import { axiosInstance } from './base';

export interface LoginResponseDto {
	accessToken: string;
}

function storeToken(token: string): void {
	accessToken.set(token);
}

export function login(email: string, password: string) {
	return axiosInstance.post<LoginResponseDto>('/auth/login', { email, password }).then((response) => {
		storeToken(response.data.accessToken);
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

export function oauthGoogle(idToken: string): Promise<LoginResponseDto> {
	return axiosInstance
		.post<LoginResponseDto>('/auth/oauth/google', { idToken })
		.then((response) => {
			storeToken(response.data.accessToken);
			return response.data;
		});
}

export function oauthApple(idToken: string, name?: string): Promise<LoginResponseDto> {
	return axiosInstance
		.post<LoginResponseDto>('/auth/oauth/apple', { idToken, name })
		.then((response) => {
			storeToken(response.data.accessToken);
			return response.data;
		});
}
