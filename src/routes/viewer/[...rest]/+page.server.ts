import { getAnnotations, getImagingInfo, getSeriesInfo } from '$lib/dicom-web/series';
import { DICOMWEB_URLS } from '$lib/dicom-web';
import { getDicomwebUrl } from '$lib/dicom-web/server';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const paths = params.rest.split('/');
	const server = paths.length === 3 ? (paths.shift() as string) : DICOMWEB_URLS[0].name;
	const [studyUid, seriesUid] = paths;

	const baseUrl = getDicomwebUrl(server);
	const series = await getSeriesInfo(baseUrl, studyUid, seriesUid);
	const smSeriesUid = series?.modality === 'SM' ? seriesUid : series?.referencedSeriesUid;

	return {
		baseUrl: baseUrl,
		studyUid: studyUid,
		seriesUid: smSeriesUid as string,
		images: await getImagingInfo(baseUrl, studyUid, smSeriesUid!),
		annotations: series?.modality === 'ANN' ? await getAnnotations(baseUrl, studyUid, seriesUid) : [],
	};
};
