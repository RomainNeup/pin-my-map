import { axiosInstance } from './base';

/**
 * Tag interface
 */
export interface Tag {
	id: string;
	name: string;
	emoji: string;
	color?: string;
}

export interface CreateTagRequest {
	name: string;
	emoji: string;
	color?: string;
}

export interface UpdateTagRequest {
	name: string;
	emoji: string;
	color?: string;
}

export function getTags() {
	return axiosInstance.get<Tag[]>('/tag').then((response) => response.data);
}

export function createTag(tag: CreateTagRequest): Promise<Tag> {
	return axiosInstance.post<Tag>('/tag', tag).then((response) => response.data);
}

export function updateTag(id: string, tag: UpdateTagRequest): Promise<Tag> {
	return axiosInstance.put<Tag>(`/tag/${id}`, tag).then((response) => response.data);
}

export function deleteTag(id: string): Promise<void> {
	return axiosInstance.delete(`/tag/${id}`).then(() => undefined);
}
