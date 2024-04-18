import { DicomTags, fetchDicomJson } from '$lib/dicom-web';

export interface SeriesInfo {
	modality: string;
	imageType?: number;
	referencedSeriesUid?: string;
}

export const getSeriesInfo = async (studyUid: string, seriesUid: string) => {
	const dicomJson = await fetchDicomJson({ studyUid, seriesUid, pathname: '/metadata' });
	if (!dicomJson || dicomJson.length === 0) {
		return null;
	}

	const metadata = dicomJson[0];

	const modality = metadata[DicomTags.Modality]?.Value?.[0] as string;

	if (modality == 'SM') {
		return {
			modality,
			imageType: metadata[DicomTags.ImageType]?.Value as string[],
		};
	} else if (modality === 'ANN') {
		return {
			modality,
			referencedSeriesUid: (metadata[DicomTags.SeriesInstanceUID]?.Value?.[0] as string) ?? '',
		};
	}

	return null;
};

const fetchInstanceMetadata = async (studyUid: string, seriesUid: string, instanceUid: string) => {
	const dicomJson = await fetchDicomJson({ studyUid, seriesUid, instanceUid, pathname: '/metadata' });
	return dicomJson[0];
};

export interface ImagingInfo {
	modality: string;
	imageType: string[];
	instanceUID: string;
	numberOfFrames: number;
	columns: number;
	totalPixelMatrixColumns: number;
	totalPixelMatrixRows: number;
}

export const sortImagingInfo = (a: ImagingInfo | undefined, b: ImagingInfo | undefined) => {
	if (!a || !b) return 0;
	const aSize = a.totalPixelMatrixColumns * a.totalPixelMatrixRows;
	const bSize = b.totalPixelMatrixColumns * b.totalPixelMatrixRows;
	return aSize === bSize ? a.numberOfFrames - b.numberOfFrames : aSize - bSize;
};

export const getImagingInfo = async (studyUid: string, seriesUid: string): Promise<ImagingInfo[]> => {
	const dicomJson = await fetchDicomJson({ studyUid, seriesUid, pathname: '/instances' });
	const instanceUids = dicomJson.map((instance) => instance[DicomTags.SOPInstanceUID]?.Value?.[0] as string);
	const metadata = await Promise.all(instanceUids.map(fetchInstanceMetadata.bind(null, studyUid, seriesUid)));

	const instances = metadata.map((metadata) => {
		const modality = metadata[DicomTags.Modality]?.Value?.[0] as string;

		if (modality === 'SM') {
			return {
				modality,
				imageType: metadata[DicomTags.ImageType]?.Value as string[],
				instanceUID: metadata[DicomTags.SOPInstanceUID]?.Value?.[0] as string,
				numberOfFrames: metadata[DicomTags.NumberOfFrames]?.Value?.[0] as number,
				columns: metadata[DicomTags.Columns]?.Value?.[0] as number,
				totalPixelMatrixColumns: metadata[DicomTags.TotalPixelMatrixColumns]?.Value?.[0] as number,
				totalPixelMatrixRows: metadata[DicomTags.TotalPixelMatrixRows]?.Value?.[0] as number,
			};
		}
	});

	return instances.filter(Boolean).toSorted(sortImagingInfo) as ImagingInfo[];
};
