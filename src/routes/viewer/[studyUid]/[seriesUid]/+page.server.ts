import { getAnnotations, getImagingInfo, getSeriesInfo } from '$lib/dicom-web/series';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const series = await getSeriesInfo(params.studyUid, params.seriesUid);
	const smSeriesUid = series?.modality === 'SM' ? params.seriesUid : series?.referencedSeriesUid;

	return {
		studyUid: params.studyUid,
		seriesUid: smSeriesUid as string,
		images: await getImagingInfo(params.studyUid, smSeriesUid!),
		...(series?.modality === 'ANN' ? { annotations: await getAnnotations(params.studyUid, params.seriesUid) } : {}),
	};
};
