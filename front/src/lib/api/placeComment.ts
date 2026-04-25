import axios from 'axios';
import { env } from '$env/dynamic/public';
import { axiosInstance } from './base';

export interface PlaceComment {
	id: string;
	authorId: string;
	authorName: string;
	authorSlug?: string;
	body: string;
	createdAt: string;
}

const publicClient = axios.create({
	baseURL: env.PUBLIC_API_BASE_URL,
	headers: { 'Content-Type': 'application/json' }
});

export function listPlaceComments(savedPlaceId: string): Promise<PlaceComment[]> {
	return publicClient
		.get<PlaceComment[]>(`/comments/saved/${encodeURIComponent(savedPlaceId)}`)
		.then(({ data }) => data);
}

export function createPlaceComment(savedPlaceId: string, body: string): Promise<PlaceComment> {
	return axiosInstance
		.post<PlaceComment>(`/comments/saved/${encodeURIComponent(savedPlaceId)}`, { body })
		.then(({ data }) => data);
}

export function deletePlaceComment(commentId: string): Promise<void> {
	return axiosInstance.delete(`/comments/${encodeURIComponent(commentId)}`).then(() => undefined);
}
