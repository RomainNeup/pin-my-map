import type { Place } from './place';
import { axiosInstance } from './base';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface SuggestionChanges {
	name?: string;
	description?: string;
	address?: string;
	image?: string;
	location?: { lat: number; lng: number };
}

export interface Suggestion {
	id: string;
	status: SuggestionStatus;
	submitterId: string;
	submitterName?: string;
	submitterEmail?: string;
	place?: Place;
	placeId: string;
	changes: SuggestionChanges;
	note?: string;
	reviewedBy?: string;
	reviewedAt?: string;
	reviewReason?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSuggestionRequest {
	placeId: string;
	changes: SuggestionChanges;
	note?: string;
}

export function createSuggestion(req: CreateSuggestionRequest): Promise<Suggestion> {
	return axiosInstance.post<Suggestion>('/suggestion', req).then(({ data }) => data);
}

export function listSuggestions(status?: SuggestionStatus): Promise<Suggestion[]> {
	const query = status ? `?status=${status}` : '';
	return axiosInstance.get<Suggestion[]>(`/suggestion${query}`).then(({ data }) => data);
}

export function approveSuggestion(id: string): Promise<Suggestion> {
	return axiosInstance.post<Suggestion>(`/suggestion/${id}/approve`).then(({ data }) => data);
}

export function rejectSuggestion(id: string, reason?: string): Promise<Suggestion> {
	return axiosInstance
		.post<Suggestion>(`/suggestion/${id}/reject`, { reason })
		.then(({ data }) => data);
}

export function listMine(): Promise<Suggestion[]> {
	return axiosInstance.get<Suggestion[]>('/suggestion/mine').then(({ data }) => data);
}

export interface SuggestionCountForPlace {
	pending: number;
	total: number;
}

export function countForPlace(placeId: string): Promise<SuggestionCountForPlace> {
	return axiosInstance
		.get<SuggestionCountForPlace>(`/suggestion/place/${placeId}/count`)
		.then(({ data }) => data);
}
