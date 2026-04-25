import { getPublicMapByToken } from '$lib/api/publicMap';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	try {
		const map = await getPublicMapByToken(params.token);
		return { map, basePath: `/public/${params.token}` };
	} catch {
		throw error(404, 'Public map not found');
	}
};
