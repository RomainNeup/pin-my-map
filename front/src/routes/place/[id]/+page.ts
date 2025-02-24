import { getSavedPlace, type SavedPlace } from "$lib/api/savedPlace";
import { getTags, type Tag } from "$lib/api/tag";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
    const [placeResponse, tagsResponse] = await Promise.all([
        getSavedPlace(params.id),
        getTags()
    ]);

    return {
        savedPlace: placeResponse as SavedPlace,
        tags: tagsResponse as Tag[]
    };
};

export const ssr = false;