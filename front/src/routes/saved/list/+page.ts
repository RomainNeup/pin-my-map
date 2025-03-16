import { getSavedPlaces, type SavedPlace } from "$lib/api/savedPlace";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
    const [savedPlacesResponse] = await Promise.all([
        getSavedPlaces(),
    ]);

    return {
        savedPlaces: savedPlacesResponse as SavedPlace[],
    };
};

export const ssr = false;