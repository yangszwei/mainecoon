import { DicomTag } from './tag';
import { formatValue } from './vr';

/** A DICOM JSON model object. */
export type DicomJson = Partial<Record<DicomTag, DicomAttribute>>;

/** A DICOM attribute. */
export interface DicomAttribute {
	vr: string;
	Value?: (string | number | DicomJson)[];
	BulkDataURI?: string;
	InlineBinary?: string;
}

export { DicomTag };

/** The options used to construct a DICOMweb URI. */
export interface FetchOptions {
	/** The base URL of the DICOMweb server */
	baseUrl: string;
	/** The study instance UID */
	studyUid?: string;
	/** The series instance UID */
	seriesUid?: string;
	/** The instance UID */
	instanceUid?: string;
	/** The frame number */
	frameNumber?: number;
	/** The endpoint name (e.g., `metadata`, `rendered`) */
	name?: string;
	/** The search parameters */
	searchParams?: Record<string, string> | URLSearchParams;
}

/**
 * Constructs a DICOMweb URI from the given options.
 *
 * @param options The options used to construct the DICOMweb URI.
 * @returns The DICOMweb URI.
 */
export function toDicomWebUri(options: FetchOptions): string {
	let uri = options.baseUrl;
	if (options.studyUid) uri += `/studies/${options.studyUid}`;
	if (options.seriesUid) uri += `/series/${options.seriesUid}`;
	if (options.instanceUid) uri += `/instances/${options.instanceUid}`;
	if (options.frameNumber) uri += `/frames/${options.frameNumber}`;
	if (options.name) uri += `/${options.name}`;
	if (options.searchParams) {
		if (typeof options.searchParams === 'object') {
			options.searchParams = new URLSearchParams(options.searchParams);
		}
		uri += `?${options.searchParams.toString()}`;
	}
	return uri;
}

/**
 * A convenience wrapper around `fetch` that fetches DICOM JSON.
 *
 * @param options The options used to construct the DICOMweb URI.
 * @returns The DICOM JSON response.
 */
export const fetchDicomJson = async (options: FetchOptions): Promise<DicomJson[]> => {
	const response = await fetch(toDicomWebUri(options), {
		headers: { Accept: 'application/dicom+json' },
	});
	if (!response.ok && response.status !== 404) {
		throw new Error(`Failed to fetch: [${response.status}] ${(await response.text()) || response.statusText}`);
	}

	if (response.status === 204 || response.status === 404) {
		return [];
	}

	return await response.json();
};

/** This is a helper function used to display DICOM values on the UI. */
export const $dicom = (dicomJson: DicomJson | null, ...tags: DicomTag[]): string => {
	if (!dicomJson) {
		return '';
	}

	const currentAttribute = dicomJson[tags[0]];
	if (!currentAttribute) {
		return '';
	}

	const currentValue = currentAttribute.Value?.[0];
	if (!currentValue) {
		return '';
	}

	// Continue down the path if there are more tags
	if (tags.length > 1) {
		return $dicom(currentValue as DicomJson, ...tags.slice(1));
	}

	// Return the value formatted based on the VR
	return formatValue(currentAttribute.vr, currentValue);
};
