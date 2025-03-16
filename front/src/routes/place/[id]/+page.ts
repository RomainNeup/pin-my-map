import { getPlace, type Place } from "$lib/api/place";
import { isSavedPlace, type IsSavedPlaceResponse } from "$lib/api/savedPlace";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
    const [placeResponse, isSavedResonse] = await Promise.all([
        getPlace(params.id),
        isSavedPlace(params.id)
    ]);

    return {
        place: placeResponse as Place,
        saved: isSavedResonse as IsSavedPlaceResponse
    };
};

export const ssr = false;