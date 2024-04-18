import { env } from '$env/dynamic/public';

// prettier-ignore
export type DicomJson = Record<string, {
	vr: string;
	Value?: (string | number | DicomJson)[];
	BulkDataURI?: string;
	InlineBinary?: string;
}>

export enum DicomTags {
	StudyDate = '00080020',
	AccessionNumber = '00080050',
	Modality = '00080060',
	ModalitiesInStudy = '00080061',
	PatientName = '00100010',
	PatientID = '00100020',
	PatientBirthDate = '00100030',
	PatientSex = '00100040',
	StudyInstanceUID = '0020000D',
	SeriesInstanceUID = '0020000E',
	NumberOfFrames = '00280008',
	AnnotationGroupSequence = '006A0002',
	TotalPixelMatrixColumns = '00480006',
	TotalPixelMatrixRows = '00480007',
	GraphicType = '00700023',
}

export const DICOMWEB_URL = env.PUBLIC_DICOMWEB_URL;

/**
 * Fetch JSON data from the DICOM web server.
 *
 * @param input The literal path or an object with identifiers and path.
 * @param fetcher The fetch function.
 * @returns The JSON data.
 */
export const fetchDicomJson = async (input: string | object, fetcher = fetch): Promise<DicomJson[]> => {
	if (typeof input === 'object') {
		const { studyUid, seriesUid, instanceUid, pathname, searchParams } = input as never;
		input = '';
		if (studyUid) input = `/studies/${studyUid}`;
		if (seriesUid) input += `/series/${seriesUid}`;
		if (instanceUid) input += `/instances/${instanceUid}`;
		if (pathname) input += pathname;
		if (searchParams) input += `?${(searchParams as URLSearchParams).toString()}`;
	}

	const response = await fetcher(DICOMWEB_URL + input);
	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.status} ${response.statusText} ${await response.text()}`);
	}

	if (response.status === 204) {
		return [];
	}

	return await response.json();
};
