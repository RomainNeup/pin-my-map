import { axiosInstance } from './base';

export interface FollowStats {
	followerCount: number;
	followingCount: number;
	isFollowing: boolean;
}

export interface FollowUser {
	userId: string;
	name: string;
	publicSlug?: string;
	isPublic: boolean;
	followedAt: string;
}

export function followUser(userId: string): Promise<FollowStats> {
	return axiosInstance
		.post<FollowStats>(`/follow/${encodeURIComponent(userId)}`)
		.then(({ data }) => data);
}

export function unfollowUser(userId: string): Promise<FollowStats> {
	return axiosInstance
		.delete<FollowStats>(`/follow/${encodeURIComponent(userId)}`)
		.then(({ data }) => data);
}

export function getFollowStats(userId: string): Promise<FollowStats> {
	return axiosInstance
		.get<FollowStats>(`/follow/${encodeURIComponent(userId)}/stats`)
		.then(({ data }) => data);
}

export function listMyFollowing(): Promise<FollowUser[]> {
	return axiosInstance.get<FollowUser[]>('/follow/me/following').then(({ data }) => data);
}

export function listMyFollowers(): Promise<FollowUser[]> {
	return axiosInstance.get<FollowUser[]>('/follow/me/followers').then(({ data }) => data);
}
