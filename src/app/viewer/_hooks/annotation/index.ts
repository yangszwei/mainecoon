import { $dicom, DicomTag } from '@/lib/dicom-web';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import convert from 'color-convert';
import { fetchDicomJson } from '@/lib/dicom-web';
import { useEffect } from 'react';
import { useImmerReducer } from 'use-immer';

/** Default color for annotations. */
export const defaultColor = '#3399CC';

export enum GraphicType {
	Point = 'POINT',
	Polyline = 'POLYLINE',
	Polygon = 'POLYGON',
	Ellipse = 'ELLIPSE',
	Rectangle = 'RECTANGLE',
}

export interface Annotation {
	seriesUid: string;
	groupUid: string;
	name: string;
	status: 'initialized' | 'ready' | 'loading' | 'error';
	color: string;
	graphicType: GraphicType;
	numberOfAnnotations: number;
	dicomJson?: DicomJson;
	editable: boolean;
	visible: boolean;
}

export type AnnotationMap = {
	[seriesUid: string]: {
		editable: boolean;
		referenceInstanceUid?: string;
		groupMap: { [groupUid: string]: Annotation };
	};
};

export type AnnotationMapAction =
	| { type: 'create'; seriesUid?: string; annotation: Pick<Annotation, 'name' | 'color' | 'graphicType'> }
	| { type: 'update'; seriesUid: string; groupUid: string; annotation: Partial<Annotation> }
	| { type: 'delete'; seriesUid: string; groupUid?: string }
	| { type: 'reset'; annotationMap: AnnotationMap }
	| { type: 'refresh' };

export function useAnnotationMap(
	server: DicomServer,
	slide: DicomJson | null,
	currentAnnotation: Annotation | null,
	setCurrentAnnotation: (annotation: Annotation | null) => void,
	setDrawType: (graphicType: GraphicType | null) => void,
) {
	const [annotationMap, updateAnnotationMap] = useImmerReducer(reducer, {} as AnnotationMap);

	function reducer(annotationMap: AnnotationMap, action: AnnotationMapAction) {
		switch (action.type) {
			// Create a new annotation group, optionally create a new series if none is specified.
			case 'create':
				// `crypto.randomUUID()` is only available in secure contexts, so we use `Math.random()` as a fallback
				const randomUid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
				const seriesUid = action.seriesUid || `draft-series-${randomUid()}`;
				const groupUid = `draft-group-${randomUid()}`;
				annotationMap[seriesUid] ||= { editable: true, groupMap: {} };
				const annotation: Annotation = {
					...action.annotation,
					seriesUid,
					groupUid,
					status: 'ready',
					numberOfAnnotations: 0,
					editable: true,
					visible: true,
				};

				annotationMap[seriesUid].groupMap[groupUid] = annotation;
				setCurrentAnnotation(annotation);
				setDrawType(annotation.graphicType);

				return annotationMap;

			// Update an annotation group.
			case 'update':
				const updatedAnnotation = {
					...annotationMap[action.seriesUid].groupMap[action.groupUid],
					...action.annotation,
				};
				// Update the annotation in the map
				annotationMap[action.seriesUid].groupMap[action.groupUid] = updatedAnnotation;
				// Update the current annotation if it's being updated
				if (currentAnnotation?.seriesUid === action.seriesUid && currentAnnotation?.groupUid === action.groupUid) {
					setCurrentAnnotation(updatedAnnotation);
				}
				return annotationMap;

			// Delete an annotation group, or the entire series if no group is specified. If no group is left after deletion, the series is also deleted.
			case 'delete':
				// Remove the group or the entire series from the annotation map
				if (action.groupUid) {
					delete annotationMap[action.seriesUid].groupMap[action.groupUid];
				} else {
					delete annotationMap[action.seriesUid];
				}
				if (Object.keys(annotationMap[action.seriesUid]?.groupMap || {}).length === 0) {
					delete annotationMap[action.seriesUid];
				}

				// Clear the current annotation if it's being deleted
				if (
					currentAnnotation &&
					currentAnnotation.seriesUid === action.seriesUid &&
					(!action.groupUid || currentAnnotation.groupUid === action.groupUid)
				) {
					setCurrentAnnotation(null);
				}

				return annotationMap;

			// Reset the annotation map.
			case 'reset':
				return action.annotationMap;

			// Refresh the annotation map.
			case 'refresh':
				for (const seriesUid in annotationMap) {
					for (const groupUid in annotationMap[seriesUid].groupMap) {
						annotationMap[seriesUid].groupMap[groupUid].status = 'initialized';
					}
				}
				return annotationMap;
		}
	}

	useEffect(() => {
		/** Load annotation groups for the current slide. */
		async function loadAnnotationGroups() {
			const annotations = await fetchAnnotationGroups(server, slide);
			const annotationMap: AnnotationMap = {};

			for (const annotation of annotations) {
				const seriesUid = $dicom(annotation, DicomTag.SeriesInstanceUID) as string;
				const groupMap: AnnotationMap[string]['groupMap'] = {};

				for (const group of (annotation[DicomTag.AnnotationGroupSequence]?.Value || []) as DicomJson[]) {
					const groupUid = group[DicomTag.AnnotationGroupUID]?.Value?.[0] as string;
					groupMap[groupUid] = {
						seriesUid,
						groupUid,
						name: $dicom(group, DicomTag.AnnotationGroupLabel),
						status: 'initialized',
						color: getRecommendedColor(group[DicomTag.RecommendedDisplayCIELabValue]?.Value?.[0] as never),
						graphicType: group[DicomTag.GraphicType]?.Value?.[0] as GraphicType,
						numberOfAnnotations: group[DicomTag.NumberOfAnnotations]?.Value?.[0] as number,
						dicomJson: group,
						editable: false,
						visible: true,
					};
				}

				annotationMap[seriesUid] = {
					editable: false,
					referenceInstanceUid: getReferenceInstanceUid(annotation),
					groupMap,
				};
			}

			updateAnnotationMap({ type: 'reset', annotationMap });
		}

		loadAnnotationGroups();

		return () => {
			updateAnnotationMap({ type: 'reset', annotationMap: {} });
		};
	}, [server, setDrawType, slide, updateAnnotationMap]);

	return [annotationMap, updateAnnotationMap] as const;
}

function fetchAnnotationGroups(server: DicomServer, slide: DicomJson | null): Promise<DicomJson[]> {
	if (!server || !slide) {
		return Promise.resolve([]);
	}

	const baseUrl = server.url;
	const studyUid = slide[DicomTag.StudyInstanceUID]!.Value?.[0] as string;
	const slideUid = slide[DicomTag.SeriesInstanceUID]!.Value?.[0] as string;
	const searchParams = new URLSearchParams({ [DicomTag.Modality]: 'ANN' });

	return fetchDicomJson({ baseUrl, studyUid, name: 'series', searchParams })
		.then((data) => data.filter((series) => $dicom(series, DicomTag.Modality) === 'ANN'))
		.then((data) => data.map((series) => $dicom(series, DicomTag.SeriesInstanceUID)))
		.then((data) => data.map((seriesUid) => fetchDicomJson({ baseUrl, studyUid, seriesUid, name: 'metadata' })))
		.then((data) => Promise.all(data).then((data) => data.map((d) => d[0])))
		.then((data) =>
			data.filter((series) => {
				const referencedSeries = series[DicomTag.ReferencedSeriesSequence]?.Value?.[0] as DicomJson | undefined;
				return referencedSeries?.[DicomTag.SeriesInstanceUID]?.Value?.[0] === slideUid;
			}),
		);
}

/**
 * Extracts the referenced instance UID from the annotation group.
 *
 * @param group The DICOM JSON object of the annotation group.
 * @returns The referenced instance UID.
 */
function getReferenceInstanceUid(group: DicomJson) {
	const referenceSeries = group[DicomTag.ReferencedSeriesSequence]?.Value?.[0] as DicomJson;
	const referencedInstance = referenceSeries?.[DicomTag.ReferencedInstanceSequence]?.Value?.[0] as DicomJson;
	return referencedInstance?.[DicomTag.ReferencedSOPInstanceUID]!.Value?.[0] as string | undefined;
}

/**
 * Gets the recommended color for the annotation group.
 *
 * @param color The CIELab color to convert to hex.
 * @returns The recommended color in hex format.
 */
function getRecommendedColor(color: [number, number, number]) {
	const hex = color && convert.lab.hex(color);
	return hex ? `#${hex}` : defaultColor;
}
