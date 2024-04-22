import { type DicomJson, DicomTags, fetchDicomJson } from '$lib/dicom-web';

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
		const referencedSeriesSequence = metadata[DicomTags.ReferencedSeriesSequence]?.Value?.[0] as DicomJson;
		return {
			modality,
			referencedSeriesUid: (referencedSeriesSequence[DicomTags.SeriesInstanceUID]?.Value?.[0] as string) ?? '',
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
	rows: number;
	columns: number;
	pixelSpacing: string[];
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
				rows: metadata[DicomTags.Rows]?.Value?.[0] as number,
				columns: metadata[DicomTags.Columns]?.Value?.[0] as number,
				pixelSpacing: metadata[DicomTags.PixelSpacing]?.Value as string[],
				totalPixelMatrixColumns: metadata[DicomTags.TotalPixelMatrixColumns]?.Value?.[0] as number,
				totalPixelMatrixRows: metadata[DicomTags.TotalPixelMatrixRows]?.Value?.[0] as number,
			};
		}
	});

	return instances.filter(Boolean).toSorted(sortImagingInfo) as ImagingInfo[];
};

export interface AnnotationInfo {
	modality: string;
	graphicType: string;
	pointsData: {
		vr: string;
		inlineBinary?: string;
		uri?: string;
	};
	indexesData: {
		vr: string;
		inlineBinary?: string;
		uri?: string;
	};
}

export const getAnnotations = async (studyUid: string, seriesUid: string) => {
	const dicomJson = await fetchDicomJson({ studyUid, seriesUid, pathname: '/instances' });
	const instanceUids = dicomJson.map((instance) => instance[DicomTags.SOPInstanceUID]?.Value?.[0] as string);
	const metadata = await Promise.all(instanceUids.map(fetchInstanceMetadata.bind(null, studyUid, seriesUid)));
	const instances = metadata.flatMap((metadata) => {
		const modality = metadata[DicomTags.Modality]?.Value?.[0] as string;
		const annotations = metadata[DicomTags.AnnotationGroupSequence]?.Value as DicomJson[];

		return annotations.map((annotation) => {
			let coordinates = annotation[DicomTags.PointCoordinatesData];
			coordinates ??= annotation[DicomTags.DoublePointCoordinatesData];

			const indexes = annotation[DicomTags.LongPrimitivePointIndexList];
			const graphicType = annotation[DicomTags.GraphicType]?.Value?.[0] as string;
			const hasIndexes = graphicType === 'POLYLINE' || graphicType === 'POLYGON';

			if (modality === 'ANN') {
				return {
					modality,
					pointsData: {
						vr: coordinates.vr,
						...(coordinates.BulkDataURI
							? { uri: coordinates.BulkDataURI }
							: { inlineBinary: coordinates.InlineBinary }),
					},
					indexesData: hasIndexes
						? {
								vr: indexes.vr,
								...(indexes.BulkDataURI ? { uri: indexes.BulkDataURI } : { inlineBinary: indexes.InlineBinary }),
							}
						: {},
					graphicType: annotation[DicomTags.GraphicType]?.Value?.[0] as string,
				};
			}
		});
	});

	return instances.filter(Boolean) as AnnotationInfo[];
};
