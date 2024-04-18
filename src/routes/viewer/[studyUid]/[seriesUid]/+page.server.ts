import { getImagingInfo, getSeriesInfo } from '$lib/dicom-web/series';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const series = await getSeriesInfo(params.studyUid, params.seriesUid);
	const smSeriesUid = series?.modality === 'SM' ? params.seriesUid : series?.referencedSeriesUid;

	return {
		studyUid: params.studyUid,
		seriesUid: params.seriesUid,
		images: await getImagingInfo(params.studyUid, smSeriesUid!),
	};
};
