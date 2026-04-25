import { getPublicMapBySlug } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const map = await getPublicMapBySlug(params.slug);
		return { map, basePath: `/u/${params.slug}` };
	} catch {
		throw error(404, 'Public map not found');
	}
};
