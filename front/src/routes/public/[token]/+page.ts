import { getPublicMapByToken } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const map = await getPublicMapByToken(params.token);
		const stats = {
			savedCount: map.savedPlaces.length,
			doneCount: map.savedPlaces.filter((sp) => sp.done).length,
			tagCount: new Set(map.savedPlaces.flatMap((sp) => sp.tags.map((t) => t.id))).size
		};
		return { map, stats, basePath: `/public/${params.token}` };
	} catch {
		throw error(404, 'Public map not found');
	}
};
