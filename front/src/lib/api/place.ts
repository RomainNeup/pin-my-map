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

export interface SocialLinks {
	instagram?: string;
	facebook?: string;
	twitter?: string;
	tiktok?: string;
}

export interface Amenities {
	wheelchair?: 'yes' | 'no' | 'limited';
	outdoorSeating?: boolean;
	wifi?: 'yes' | 'no' | 'wlan';
	dietVegetarian?: 'yes' | 'no' | 'only';
	dietVegan?: 'yes' | 'no' | 'only';
	dietGlutenFree?: 'yes' | 'no' | 'only';
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
	googleMapsUri?: string;
	socialLinks?: SocialLinks;
	amenities?: Amenities;
	reservationLinks?: string[];
	fetchedAt: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface EnrichmentConflictValue {
	provider: string;
	value: unknown;
}

export interface EnrichmentConflict {
	field: string;
	values: EnrichmentConflictValue[];
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
	moderationStatus?: ModerationStatus;
	rejectionReason?: string;
	creatorId?: string;
	creatorName?: string;
	creatorEmail?: string;
	createdAt?: string;
	permanentlyClosed?: boolean;
	permanentlyClosedAt?: string;
	saveCount?: number;
	hasUnresolvedConflicts: boolean;
	enrichmentConflicts?: EnrichmentConflict[];
}

export interface PlaceConflictsPage {
	items: Place[];
	total: number;
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

export function listPending(): Promise<Place[]> {
	return axiosInstance.get<Place[]>('/place/pending').then(({ data }) => data);
}

export function approvePlace(id: string): Promise<Place> {
	return axiosInstance.post<Place>(`/place/${id}/approve`).then(({ data }) => data);
}

export function rejectPlace(id: string, reason?: string): Promise<Place> {
	return axiosInstance.post<Place>(`/place/${id}/reject`, { reason }).then(({ data }) => data);
}

export interface BulkEnrichRequest {
	onlyMissing?: boolean;
	limit?: number;
	delayMs?: number;
}

export interface BulkEnrichError {
	placeId: string;
	message: string;
}

export interface BulkEnrichSummary {
	scanned: number;
	enriched: number;
	skipped: number;
	failed: number;
	errors: BulkEnrichError[];
}

export function bulkEnrich(params: BulkEnrichRequest): Promise<BulkEnrichSummary> {
	return axiosInstance
		.post<BulkEnrichSummary>('/place/bulk-enrich', params)
		.then(({ data }) => data);
}

export function setPermanentlyClosed(
	id: string,
	closed: boolean,
	reason?: string
): Promise<Place> {
	return axiosInstance
		.post<Place>(`/place/${id}/closed`, { closed, reason })
		.then(({ data }) => data);
}

export function listConflicts(
	params: { limit?: number; offset?: number } = {}
): Promise<PlaceConflictsPage> {
	return axiosInstance
		.get<PlaceConflictsPage>('/place/conflicts', { params })
		.then(({ data }) => data);
}

export function resolveConflict(
	placeId: string,
	field: string,
	value: unknown
): Promise<Place> {
	return axiosInstance
		.post<Place>(`/place/${placeId}/resolve-conflict`, { field, value })
		.then(({ data }) => data);
}

export function dismissConflict(placeId: string, field: string): Promise<Place> {
	return axiosInstance
		.post<Place>(`/place/${placeId}/dismiss-conflict`, { field })
		.then(({ data }) => data);
}
