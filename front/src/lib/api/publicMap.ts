import axios from 'axios';
import { env } from '$env/dynamic/public';
import { axiosInstance } from './base';
import type { Place } from './place';

export interface PublicTag {
	id: string;
	name: string;
	emoji?: string;
}

export interface PublicSavedPlace {
	id: string;
	place: Place;
	createdAt: string;
	tags: PublicTag[];
	done: boolean;
	comment: string;
	rating?: number;
}

export interface PublicMapOwner {
	userId?: string;
	name: string;
	publicSlug?: string;
	points?: number;
	level?: number;
}

export interface PublicMap {
	owner: PublicMapOwner;
	savedPlaces: PublicSavedPlace[];
}

const client = axios.create({
	baseURL: env.PUBLIC_API_BASE_URL,
	headers: { 'Content-Type': 'application/json' }
});

export interface PublicMapSummary {
	userId: string;
	name: string;
	publicSlug: string;
	savedCount: number;
	followerCount: number;
	points?: number;
	level?: number;
}

export interface PublicMapStatsDto {
	savedCount: number;
	doneCount: number;
	tagCount: number;
}

export function discoverPublicMaps(query?: string): Promise<PublicMapSummary[]> {
	const params = query?.trim() ? { q: query.trim() } : undefined;
	return client
		.get<PublicMapSummary[]>('/public/discover', { params })
		.then(({ data }) => data);
}

export function getPublicMapBySlug(slug: string): Promise<PublicMap> {
	return client.get<PublicMap>(`/public/slug/${encodeURIComponent(slug)}`).then(({ data }) => data);
}

export function getPublicMapByToken(token: string): Promise<PublicMap> {
	return client
		.get<PublicMap>(`/public/token/${encodeURIComponent(token)}`)
		.then(({ data }) => data);
}

export function getPublicSavedPlaceBySlug(
	slug: string,
	savedPlaceId: string
): Promise<PublicSavedPlace> {
	return client
		.get<PublicSavedPlace>(
			`/public/slug/${encodeURIComponent(slug)}/place/${encodeURIComponent(savedPlaceId)}`
		)
		.then(({ data }) => data);
}

export function getPublicSavedPlaceByToken(
	token: string,
	savedPlaceId: string
): Promise<PublicSavedPlace> {
	return client
		.get<PublicSavedPlace>(
			`/public/token/${encodeURIComponent(token)}/place/${encodeURIComponent(savedPlaceId)}`
		)
		.then(({ data }) => data);
}

export function getPublicMapStats(slug: string): Promise<PublicMapStatsDto> {
	return client
		.get<PublicMapStatsDto>(`/public/slug/${encodeURIComponent(slug)}/stats`)
		.then(({ data }) => data);
}

export function getFollowingPublicMaps(): Promise<PublicMapSummary[]> {
	return axiosInstance.get<PublicMapSummary[]>('/public/following').then(({ data }) => data);
}
