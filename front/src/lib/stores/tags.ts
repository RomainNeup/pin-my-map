import { getTags, type Tag } from '$lib/api/tag';
import { writable } from 'svelte/store';

export const tags = writable<Tag[]>();

export async function loadTags(): Promise<void> {
	try {
		const fresh = await getTags();
		tags.set(fresh);
	} catch (error) {
		console.error(error);
	}
}

export async function reloadTags(): Promise<void> {
	const fresh = await getTags();
	tags.set(fresh);
}

export function addTag(tag: Tag): void {
	tags.update((current) => [...(current ?? []), tag]);
}

export function replaceTag(tag: Tag): void {
	tags.update((current) => (current ?? []).map((t) => (t.id === tag.id ? tag : t)));
}

export function removeTag(id: string): void {
	tags.update((current) => (current ?? []).filter((t) => t.id !== id));
}
