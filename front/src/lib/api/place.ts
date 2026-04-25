import { axiosInstance } from './base';

export interface PlaceEnrichmentPhoto {
	url: string;
	attribution?: string;
}

export interface PlaceEnrichmentReview {
	author: string;
	rating: number;
	text: string;
	time: number;
}

export interface PlaceEnrichment {
	externalId: string;
	providerName: string;
	photos?: PlaceEnrichmentPhoto[];
	website?: string;
	phoneNumber?: string;
	openingHours?: { weekdayText: string[] };
	externalRating?: number;
	externalRatingCount?: number;
	reviews?: PlaceEnrichmentReview[];
	priceLevel?: number;
	types?: string[];
	fetchedAt: string;
}

export interface Place {
	id: string;
	name: string;
	location: { lat: number; lng: number };
	address: string;
	description?: string;
	image?: string;
	externalId?: string;
	externalProvider?: string;
	enrichment?: PlaceEnrichment;
	enrichedAt?: string;
	createdBy?: string;
	summary?: string;
}

export interface CreatePlaceRequest {
	name: string;
	location: { lat: number; lng: number };
	address: string;
	description?: string;
	image?: string;
}

export type UpdatePlaceRequest = Partial<CreatePlaceRequest>;

export function getPlace(id: string): Promise<Place> {
	return axiosInstance.get<Place>(`/place/${id}`).then(({ data }) => data);
}

export function searchPlaces(query: string): Promise<Place[]> {
	return axiosInstance
		.get<Place[]>('/place/search', { params: { q: query } })
		.then(({ data }) => data);
}

export function createPlace(place: CreatePlaceRequest): Promise<Place> {
	return axiosInstance.post<Place>('/place', place).then(({ data }) => data);
}

export function updatePlace(id: string, payload: UpdatePlaceRequest): Promise<Place> {
	return axiosInstance.put<Place>(`/place/${id}`, payload).then(({ data }) => data);
}

export function refreshEnrichment(id: string): Promise<Place> {
	return axiosInstance.post<Place>(`/place/${id}/refresh-enrichment`).then(({ data }) => data);
}
