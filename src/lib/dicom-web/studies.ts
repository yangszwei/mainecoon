import { DicomTags, fetchDicomJson } from '$lib/dicom-web';

import type { DicomJson } from '$lib/dicom-web';

export interface StudyFilter {
	patientId?: string;
	patientName?: string;
	studyUid?: string;
	accessionNumber?: string;
	studyDate?: string;
}

export interface DicomStudy {
	accessionNumber: string;
	modalities: string[];
	patientBirthDate: string;
	patientId: string;
	patientName: string;
	patientSex: string;
	studyDate: string;
	studyUid: string;
}

export const getStudiesByFilter = async (
	baseUrl: string,
	filter: StudyFilter,
	fetcher = fetch,
): Promise<DicomStudy[]> => {
	const searchParams = new URLSearchParams({ [DicomTags.ModalitiesInStudy]: 'SM' });
	if (filter.patientId) searchParams.set(DicomTags.PatientID, filter.patientId);
	if (filter.patientName) searchParams.set(DicomTags.PatientName, filter.patientName);
	if (filter.studyUid) searchParams.set(DicomTags.StudyInstanceUID, filter.studyUid);
	if (filter.accessionNumber) searchParams.set(DicomTags.AccessionNumber, filter.accessionNumber);
	if (filter.studyDate) searchParams.set(DicomTags.StudyDate, filter.studyDate);

	const dicomJson = await fetchDicomJson({ baseUrl, pathname: '/studies', searchParams }, fetcher);

	return dicomJson.map((study) => ({
		studyDate: (study[DicomTags.StudyDate]?.Value?.[0] as string) ?? '',
		accessionNumber: (study[DicomTags.AccessionNumber]?.Value?.[0] as string) ?? '',
		modalities: (study[DicomTags.ModalitiesInStudy]?.Value as string[]) ?? '',
		// @ts-expect-error Alphabetic is not defined in the type definition.
		patientName: (study[DicomTags.PatientName]?.Value?.[0]?.Alphabetic as string) ?? '',
		patientId: (study[DicomTags.PatientID]?.Value?.[0] as string) ?? '',
		patientBirthDate: (study[DicomTags.PatientBirthDate]?.Value?.[0] as string) ?? '',
		patientSex: (study[DicomTags.PatientSex]?.Value?.[0] as string) ?? '',
		studyUid: (study[DicomTags.StudyInstanceUID]?.Value?.[0] as string) ?? '',
	}));
};

export interface StudyInfo {
	modality: string;
	numberOfFrames?: number;
	thumbnail?: string;
	instances?: number;
	graphicType?: string[];
	seriesUid: string;
	studyUid: string;
}

const fetchSeriesMetadata = async (baseUrl: string, studyUid: string, seriesUid: string) => {
	const dicomJson = await fetchDicomJson({ baseUrl, studyUid, seriesUid, pathname: '/metadata' });
	return dicomJson[0];
};

const toGraphicType = (ann: DicomJson) => ann[DicomTags.GraphicType]?.Value as string[];

const getSeriesInstanceCount = async (baseUrl: string, studyUid: string, seriesUid: string, fetcher = fetch) => {
	if (!studyUid || !seriesUid) return null;
	const dicomJson = await fetchDicomJson({ baseUrl, studyUid, seriesUid, pathname: '/instances' }, fetcher);
	return dicomJson.length;
};

export const getStudyInfo = async (baseUrl: string, studyUid: string, fetcher = fetch) => {
	const dicomJson = await fetchDicomJson({ baseUrl, studyUid, pathname: '/series' }, fetcher);
	const seriesUids = dicomJson.map((series) => series[DicomTags.SeriesInstanceUID]?.Value?.[0] as string);
	const metadata = await Promise.all(seriesUids.map(fetchSeriesMetadata.bind(null, baseUrl, studyUid)));

	const series: (StudyInfo | undefined)[] = metadata.map((metadata) => {
		const modality = metadata[DicomTags.Modality]?.Value?.[0] as string;

		if (modality === 'SM') {
			return {
				modality: (metadata[DicomTags.Modality]?.Value?.[0] as string) ?? '',
				numberOfFrames: (metadata[DicomTags.NumberOfFrames]?.Value?.[0] as number) ?? null,
				seriesUid: (metadata[DicomTags.SeriesInstanceUID]?.Value?.[0] as string) ?? null,
				studyUid: (metadata[DicomTags.StudyInstanceUID]?.Value?.[0] as string) ?? '',
			};
		} else if (modality === 'ANN') {
			const annotations = metadata[DicomTags.AnnotationGroupSequence]?.Value as DicomJson[];

			return {
				modality: (metadata[DicomTags.Modality]?.Value?.[0] as string) ?? '',
				graphicType: [...new Set(annotations?.flatMap(toGraphicType))],
				seriesUid: (metadata[DicomTags.SeriesInstanceUID]?.Value?.[0] as string) ?? null,
				studyUid: (metadata[DicomTags.StudyInstanceUID]?.Value?.[0] as string) ?? '',
			};
		}
	});

	const sm = series
		.filter((series) => series?.modality === 'SM')
		.sort((a, b) => (a?.numberOfFrames ?? 0) - (b?.numberOfFrames ?? 0))[0];

	if (sm) {
		sm.thumbnail = sm.seriesUid ? `${baseUrl}/studies/${studyUid}/series/${sm.seriesUid}/thumbnail` : undefined;
		sm.instances = (await getSeriesInstanceCount(baseUrl, studyUid, sm.seriesUid as string)) ?? undefined;
	}

	return {
		sm,
		annotations: series.filter((series) => series?.modality === 'ANN'),
	};
};

/**
 * (Compare function) Sort DICOM instances by the number of pixels in the image.
 *
 * @param a The first DICOM instance.
 * @param b The second DICOM instance.
 * @returns The comparison result.
 */
export const sortSmImages = (a: DicomJson, b: DicomJson) => {
	const aColumns = a[DicomTags.TotalPixelMatrixColumns].Value![0] as number;
	const aRows = a[DicomTags.TotalPixelMatrixRows].Value![0] as number;
	const aFrames = a[DicomTags.NumberOfFrames].Value![0] as number;
	const bColumns = b[DicomTags.TotalPixelMatrixColumns].Value![0] as number;
	const bRows = b[DicomTags.TotalPixelMatrixRows].Value![0] as number;
	const bFrames = b[DicomTags.NumberOfFrames].Value![0] as number;
	const aSize = aColumns * aRows;
	const bSize = bColumns * bRows;
	return aSize === bSize ? aFrames - bFrames : aSize - bSize;
};
