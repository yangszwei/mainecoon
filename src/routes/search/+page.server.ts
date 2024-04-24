import { getStudiesByFilter } from '$lib/dicom-web/studies';

import type { PageServerLoad } from './$types';
import { getDicomwebUrl } from '$lib/dicom-web/server';

export const load: PageServerLoad = async ({ url }) => {
	const filter = Object.fromEntries(url.searchParams.entries());

	return {
		filter,
		studies: await getStudiesByFilter(getDicomwebUrl(filter.server), filter),
	};
};
