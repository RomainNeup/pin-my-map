import { getPublicMapBySlug, getPublicSavedPlaceBySlug } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const [savedPlace, map] = await Promise.all([
			getPublicSavedPlaceBySlug(params.slug, params.id),
			getPublicMapBySlug(params.slug)
		]);
		return {
			savedPlace,
			ownerUserId: map.owner.userId,
			ownerName: map.owner.name,
			slug: params.slug
		};
	} catch {
		throw error(404, 'Place not found');
	}
};
