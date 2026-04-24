import { getSavedPlace, type SavedPlace } from '$lib/api/savedPlace';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const savedPlace = await getSavedPlace(params.id);

	return {
		savedPlace: savedPlace as SavedPlace
	};
};

export const ssr = false;
