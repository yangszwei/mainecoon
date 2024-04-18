import type { PageServerLoad } from './$types';
import { getStudiesByFilter } from '$lib/dicom-web/studies';

export const load: PageServerLoad = async ({ url }) => {
	const filter = Object.fromEntries(url.searchParams.entries());

	return {
		filter,
		studies: await getStudiesByFilter(filter),
	};
};
