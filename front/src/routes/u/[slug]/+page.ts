import { getPublicMapBySlug, getPublicMapStats } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const [map, stats] = await Promise.all([
			getPublicMapBySlug(params.slug),
			getPublicMapStats(params.slug).catch(() => null)
		]);
		return { map, stats, basePath: `/u/${params.slug}` };
	} catch {
		throw error(404, 'Public map not found');
	}
};
