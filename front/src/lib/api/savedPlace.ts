import { setError } from "$lib/store/error";
import { axiosInstance } from "./base";
import type { Place } from "./place";
import type { Tag } from "./tag";

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

export function getSavedPlaces(): Promise<SavedPlace[] | void> {
    console.log(axiosInstance.defaults.headers.common);
    return axiosInstance.get<SavedPlace[]>("/saved")
        .then(({ data }) => data);
}

export function getSavedPlace(id: string): Promise<SavedPlace | void> {
    return axiosInstance.get<SavedPlace>(`/saved/${id}`)
        .then(({ data }) => data);
}

export function isSavedPlace(placeId: string): Promise<IsSavedPlaceResponse | false> {
    return axiosInstance.get<IsSavedPlaceResponse>(`/saved/${placeId}/exists`)
        .then(({ data }) => data)
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

export function toogleDoneSavedPlace(savedPlaceId: string): Promise<void> {
    return axiosInstance.patch(`/saved/${savedPlaceId}/done`);
}

export function addCommentToSavedPlace(savedPlaceId: string, comment: string): Promise<void> {
    return axiosInstance.put(`/saved/${savedPlaceId}/comment`, { comment });
}

export function addRatingToSavedPlace(savedPlaceId: string, rating: number): Promise<void> {
    return axiosInstance.put(`/saved/${savedPlaceId}/rating`, { rating });
}
