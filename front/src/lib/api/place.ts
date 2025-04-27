import { axiosInstance } from "./base";

/**
 * Place interface
 */
export interface Place {
    /**
     * Place id
     */
    id: string;
    name: string;
    location: { lat: number, lng: number };
    address: string;
    description?: string;
    image?: string;
}

export interface CreatePlaceRequest {
    name: string;
    location: { lat: number, lng: number };
    address: string;
    description?: string;
    image?: string;
}

export function getPlaces(): Promise<Place[]> {
    return axiosInstance.get<Place[]>("/place")
        .then(({ data }) => data);
}

export function getPlace(id: string): Promise<Place> {
    return axiosInstance.get<Place>(`/place/${id}`)
        .then(({ data }) => data);
}

export function searchPlaces(query: string): Promise<Place[]> {
    return axiosInstance.get<Place[]>(`/place/search?q=${query}`)
        .then(({ data }) => data);
}

export function createPlace(place: CreatePlaceRequest): Promise<void> {
    return axiosInstance.post("/place", place);
}

export function updatePlace(place: Place): Promise<void> {
    return axiosInstance.put(`/place/${place.id}`, place);
}
