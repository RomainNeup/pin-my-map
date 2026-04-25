import { axiosInstance } from './base';
import type { UserRole } from '$lib/stores/user';

export interface PublicUserDto {
	id: string;
	name: string;
	publicSlug?: string;
	points: number;
	level: number;
}

export function searchUsers(q: string): Promise<PublicUserDto[]> {
	return axiosInstance.get<PublicUserDto[]>('/user/search', { params: { q } }).then(({ data }) => data);
}

export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}

export function listUsers(): Promise<AdminUser[]> {
	return axiosInstance.get<AdminUser[]>('/user').then(({ data }) => data);
}

export function updateUserRole(id: string, role: UserRole): Promise<AdminUser> {
	return axiosInstance.patch<AdminUser>(`/user/${id}/role`, { role }).then(({ data }) => data);
}

export function deleteUser(id: string): Promise<void> {
	return axiosInstance.delete(`/user/${id}`).then(() => undefined);
}

export interface PublicMapSettings {
	isPublic: boolean;
	publicSlug?: string;
	publicToken?: string;
}

export function getPublicMapSettings(): Promise<PublicMapSettings> {
	return axiosInstance.get<PublicMapSettings>('/user/me/public-map').then(({ data }) => data);
}

export function updatePublicMapSettings(payload: {
	isPublic: boolean;
	publicSlug?: string;
}): Promise<PublicMapSettings> {
	return axiosInstance
		.patch<PublicMapSettings>('/user/me/public-map', payload)
		.then(({ data }) => data);
}

export function rotatePublicToken(): Promise<PublicMapSettings> {
	return axiosInstance
		.post<PublicMapSettings>('/user/me/public-map/rotate-token')
		.then(({ data }) => data);
}

export function checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
	return axiosInstance
		.get<{ available: boolean }>(`/user/check-slug`, { params: { slug } })
		.then(({ data }) => data);
}
