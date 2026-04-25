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
	level?: number;
	followedAt: string;
}

export interface IsFollowingResult {
	following: boolean;
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

export function isFollowing(userId: string): Promise<IsFollowingResult> {
	return axiosInstance
		.get<IsFollowingResult>(`/follow/${encodeURIComponent(userId)}/is-following`)
		.then(({ data }) => data);
}
