import { axiosInstance } from './base';
import type { Place } from './place';
import type { Tag } from './tag';

export interface SavedPlace {
	id: string;
	place: Place;
	createdAt: Date;
	tags: Tag[];
	done: boolean;
	comment: string;
	rating?: number;
}

export interface IsSavedPlaceResponse {
	id?: string;
	isSaved: boolean;
}

export interface GetSavedPlacesParams {
	limit?: number;
	offset?: number;
	tagIds?: string[];
}

export function getSavedPlaces(params: GetSavedPlacesParams = {}): Promise<SavedPlace[]> {
	const query: Record<string, string | number> = {};
	if (params.limit !== undefined) query.limit = params.limit;
	if (params.offset !== undefined) query.offset = params.offset;
	if (params.tagIds && params.tagIds.length > 0) query.tagIds = params.tagIds.join(',');
	return axiosInstance.get<SavedPlace[]>('/saved', { params: query }).then(({ data }) => data);
}

export function getSavedPlace(id: string): Promise<SavedPlace> {
	return axiosInstance.get<SavedPlace>(`/saved/${id}`).then(({ data }) => data);
}

export function isSavedPlace(placeId: string): Promise<IsSavedPlaceResponse> {
	return axiosInstance
		.get<IsSavedPlaceResponse>(`/saved/${placeId}/exists`)
		.then(({ data }) => data);
}

export function createSavedPlace(placeId: string): Promise<void> {
	return axiosInstance.post(`/saved/${placeId}`);
}

export function deleteSavedPlace(savedPlaceId: string): Promise<void> {
	return axiosInstance.delete(`/saved/${savedPlaceId}`);
}

export function addTagToSavedPlace(savedPlaceId: string, tagId: string): Promise<void> {
	return axiosInstance.put(`/saved/${savedPlaceId}/tag/${tagId}`);
}

export function removeTagFromSavedPlace(savedPlaceId: string, tagId: string): Promise<void> {
	return axiosInstance.delete(`/saved/${savedPlaceId}/tag/${tagId}`);
}

export function toggleDoneSavedPlace(savedPlaceId: string): Promise<void> {
	return axiosInstance.patch(`/saved/${savedPlaceId}/done`);
}

export function addCommentToSavedPlace(savedPlaceId: string, comment: string): Promise<void> {
	return axiosInstance.put(`/saved/${savedPlaceId}/comment`, { comment });
}

export function addRatingToSavedPlace(savedPlaceId: string, rating: number): Promise<void> {
	return axiosInstance.put(`/saved/${savedPlaceId}/rating`, { rating });
}

export function exportCsv(): Promise<Blob> {
	return axiosInstance
		.get('/saved/export.csv', { responseType: 'blob' })
		.then(({ data }) => data as Blob);
}

export function searchSaved(q: string): Promise<SavedPlace[]> {
	return axiosInstance
		.get<SavedPlace[]>('/saved/search', { params: { q } })
		.then(({ data }) => data);
}
