import { getPlace, type Place } from '$lib/api/place';
import { isSavedPlace, type IsSavedPlaceResponse } from '$lib/api/savedPlace';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const [placeResponse, isSavedResponse] = await Promise.all([
		getPlace(params.id),
		isSavedPlace(params.id)
	]);

	return {
		place: placeResponse as Place,
		saved: isSavedResponse as IsSavedPlaceResponse
	};
};

export const ssr = false;
