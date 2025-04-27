import { axiosInstance } from "./base";

/**
 * Tag interface
 */
export interface Tag {
    id: string;
    name: string;
    emoji: string;
}

export interface CreateTagRequest {
    name: string;
    emoji: string;
}

export function getTags() {
    return axiosInstance.get<Tag[]>('/tag')
        .then((response) => response.data);
}

export function createTag(tag: CreateTagRequest) {
    return axiosInstance.post('/tag', tag);
}
