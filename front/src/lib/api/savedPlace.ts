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

export function getSavedPlaces(): Promise<SavedPlace[] | void> {
    console.log(axiosInstance.defaults.headers.common);
    return axiosInstance.get<SavedPlace[]>("/saved")
        .then((response) => response.data)
        .catch(err => setError(err.response.data.message));
}

export function getSavedPlace(id: string): Promise<SavedPlace | void> {
    return axiosInstance.get<SavedPlace>(`/saved/${id}`)
        .then((response) => response.data)
        .catch(err => setError(err.response.data.message));
}

export function addTagToSavedPlace(savedPlaceId: string, tagId: string): Promise<void> {
    return axiosInstance.put(`/saved/${savedPlaceId}/tag/${tagId}`)
        .then(() => {})
        .catch(err => setError(err.response.data.message));
}

export function removeTagFromSavedPlace(savedPlaceId: string, tagId: string): Promise<void> {
    return axiosInstance.delete(`/saved/${savedPlaceId}/tag/${tagId}`)
        .then(() => {})
        .catch(err => setError(err.response.data.message));
}