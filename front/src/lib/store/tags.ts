import { getTags, type Tag } from "$lib/api/tag";
import { writable } from "svelte/store";

export const tags = writable<Tag[]>();

tags.subscribe((value) => {
    if (!value) {
        getTags().then((response) => {
            tags.set(response);
        })
        .catch((error) => {
            console.error(error);
        });
    }
});