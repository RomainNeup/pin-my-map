import { axiosInstance } from './base';
import type { UserRole } from '$lib/stores/user';

export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

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
	status: UserStatus;
	rejectionReason?: string;
	suspensionReason?: string;
}

export interface ListUsersParams {
	q?: string;
	status?: UserStatus;
	limit?: number;
	offset?: number;
}

export interface InviteUserResult extends AdminUser {
	tempPassword?: string;
}

export function listUsers(params?: ListUsersParams): Promise<AdminUser[]> {
	return axiosInstance.get<AdminUser[]>('/user', { params }).then(({ data }) => data);
}

export function listPending(): Promise<AdminUser[]> {
	return axiosInstance.get<AdminUser[]>('/user/pending').then(({ data }) => data);
}

export function approveUser(id: string): Promise<AdminUser> {
	return axiosInstance.post<AdminUser>(`/user/${id}/approve`).then(({ data }) => data);
}

export function rejectUser(id: string, reason?: string): Promise<AdminUser> {
	return axiosInstance
		.post<AdminUser>(`/user/${id}/reject`, { reason })
		.then(({ data }) => data);
}

export function suspendUser(id: string, reason?: string): Promise<AdminUser> {
	return axiosInstance
		.post<AdminUser>(`/user/${id}/suspend`, { reason })
		.then(({ data }) => data);
}

export function unsuspendUser(id: string): Promise<AdminUser> {
	return axiosInstance.post<AdminUser>(`/user/${id}/unsuspend`).then(({ data }) => data);
}

export function inviteUser(payload: {
	name: string;
	email: string;
	role: UserRole;
}): Promise<InviteUserResult> {
	return axiosInstance.post<InviteUserResult>('/user', payload).then(({ data }) => data);
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
