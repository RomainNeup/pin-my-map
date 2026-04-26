import { getPublicMapBySlug, getPublicMapStats } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const PAGE_SIZE = 30;

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const [map, stats] = await Promise.all([
			getPublicMapBySlug(params.slug, { limit: PAGE_SIZE, offset: 0 }),
			getPublicMapStats(params.slug).catch(() => null)
		]);
		return { map, stats, basePath: `/u/${params.slug}`, slug: params.slug };
	} catch {
		throw error(404, 'Public map not found');
	}
};
