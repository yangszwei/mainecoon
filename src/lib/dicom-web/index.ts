import { env } from '$env/dynamic/public';

// prettier-ignore
export type DicomJson = Record<string, {
	vr: string;
	Value?: (string | number | DicomJson)[];
	BulkDataURI?: string;
	InlineBinary?: string;
}>

export enum DicomTags {
	ImageType = '00080008',
	SOPInstanceUID = '00080018',
	StudyDate = '00080020',
	AccessionNumber = '00080050',
	Modality = '00080060',
	ModalitiesInStudy = '00080061',
	ReferencedSeriesSequence = '00081115',
	ReferencedInstanceSequence = '0008114A',
	ReferencedSOPInstanceUID = '00081155',
	PatientName = '00100010',
	PatientID = '00100020',
	PatientBirthDate = '00100030',
	PatientSex = '00100040',
	StudyInstanceUID = '0020000D',
	SeriesInstanceUID = '0020000E',
	NumberOfFrames = '00280008',
	Rows = '00280010',
	Columns = '00280011',
	PixelSpacing = '00280030',
	TotalPixelMatrixColumns = '00480006',
	TotalPixelMatrixRows = '00480007',
	PointCoordinatesData = '00660016',
	DoublePointCoordinatesData = '00660022',
	LongPrimitivePointIndexList = '00660040',
	AnnotationGroupSequence = '006A0002',
	GraphicType = '00700023',
}

export const DICOMWEB_URLS = (() => {
	const urls = env.PUBLIC_DICOMWEB_URLS?.split(',');
	if (!urls || urls.length === 0) {
		throw new Error('No DICOMweb URLs are defined in the environment variables.');
	}

	return urls.map((serverStr) => {
		const [name, url] = serverStr.split('=');
		return { name, url: url || name };
	});
})();

export const toDicomWebUrl = (input: string | object) => {
	if (typeof input === 'object') {
		const { baseUrl, studyUid, seriesUid, instanceUid, frame, pathname, searchParams } = input as never;
		input = baseUrl as string;
		if (studyUid) input += `/studies/${studyUid}`;
		if (seriesUid) input += `/series/${seriesUid}`;
		if (instanceUid) input += `/instances/${instanceUid}`;
		if (frame) input += `/frames/${frame}`;
		if (pathname) input += pathname;
		if (searchParams) input += `?${(searchParams as URLSearchParams).toString()}`;
	}

	return input;
};

/**
 * Fetch JSON data from the DICOM web server.
 *
 * @param input The literal path or an object with identifiers and path.
 * @param fetcher The fetch function.
 * @returns The JSON data.
 */
export const fetchDicomJson = async (input: string | object, fetcher = fetch): Promise<DicomJson[]> => {
	const response = await fetcher(toDicomWebUrl(input));
	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText} ${await response.text()}`);
	}

	if (response.status === 204) {
		return [];
	}

	return await response.json();
};
