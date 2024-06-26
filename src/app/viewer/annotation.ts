import { $dicom, DicomTag, fetchDicomJson } from '@/lib/dicom-web';
import { Geometry, LineString, MultiPoint, Polygon } from 'ol/geom';
import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import { Feature } from 'ol';
import type { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { decodeValue } from '@/lib/dicom-web/vr';
import { multipartDecode } from '@/lib/utils/multipart';

/**
 * Fetches the annotations series for the current slide.
 *
 * @param server The DICOMweb server.
 * @param slide The current slide.
 */
function fetchAnnotationSeries(server: DicomServer, slide: DicomJson | null): Promise<DicomJson[]> {
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
 * Converts the stored coordinates to a list of points distributed along the ellipse.
 *
 * @param points The coordinates of the ellipse stored in the DICOM tag.
 * @returns The list of points distributed along the ellipse.
 */
function calculateEllipsePoints(points: number[][]) {
	const [highest, lowest, leftmost, rightmost] = points;

	// Calculate semi-major axis (a) and semi-minor axis (b)
	const a = Math.sqrt((rightmost[0] - leftmost[0]) ** 2 + (rightmost[1] - leftmost[1]) ** 2) / 2;
	const b = Math.sqrt((highest[0] - lowest[0]) ** 2 + (highest[1] - lowest[1]) ** 2) / 2;

	// Determine the center (h, k) of the ellipse
	const h = (leftmost[0] + rightmost[0]) / 2;
	const k = (highest[1] + lowest[1]) / 2;

	// Estimate the rotation angle theta
	// Assuming the major axis is closer to the line connecting highest and lowest points
	const theta = Math.atan2(rightmost[1] - leftmost[1], rightmost[0] - leftmost[0]);

	// Calculate 50 evenly distributed points along the ellipse
	const pointsOnEllipse = [];
	for (let i = 0; i < 50; i++) {
		const t = (2 * Math.PI * i) / 50;
		const xPrime = a * Math.cos(t) * Math.cos(theta) - b * Math.sin(t) * Math.sin(theta) + h;
		const yPrime = a * Math.cos(t) * Math.sin(theta) + b * Math.sin(t) * Math.cos(theta) + k;
		pointsOnEllipse.push([xPrime, yPrime]);
	}

	return pointsOnEllipse;
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
 * Creates an annotation layer from the annotation group.
 *
 * @param instanceUid The referenced instance UID.
 * @param group The DICOM JSON object of the annotation group.
 * @param resolutions The resolutions of the instances keyed by their SOPInstanceUID.
 * @returns The annotation layer source.
 */
async function createAnnotationSource(
	instanceUid: string,
	group: DicomJson,
	resolutions: { [instanceUid: string]: number },
) {
	const source = new VectorSource<Feature<Geometry>>({ wrapX: false });

	if (!group || Object.keys(group).length === 0) {
		return source;
	}

	const graphicType = group[DicomTag.GraphicType]!.Value?.[0] as string;
	const pointCoordinatesData = group[DicomTag.PointCoordinatesData];
	const pointIndexList = group[DicomTag.LongPrimitivePointIndexList];

	let points: Float64Array | Float32Array | undefined;
	let indexes: Uint32Array | undefined;

	if (pointCoordinatesData) {
		if (pointCoordinatesData.InlineBinary) {
			points = decodeValue(pointCoordinatesData.vr, pointCoordinatesData.InlineBinary) as Float64Array | Float32Array;
		} else if (pointCoordinatesData.BulkDataURI) {
			// Fetch the bulk data URI
			const response = await fetch(pointCoordinatesData.BulkDataURI);
			const bulkData = multipartDecode(await response.arrayBuffer());
			points = decodeValue(pointCoordinatesData.vr, bulkData) as Float64Array | Float32Array;
		}
	}

	const resolution = instanceUid ? resolutions[instanceUid] : Math.max(...Object.values(resolutions)) || 1;

	// Scale the points by the resolution
	points = points?.map((point) => point * resolution);

	if (pointIndexList) {
		if (pointIndexList.InlineBinary) {
			indexes = decodeValue(pointIndexList.vr, pointIndexList.InlineBinary) as Uint32Array;
		} else if (pointIndexList.BulkDataURI) {
			// Fetch the bulk data URI
			const response = await fetch(pointIndexList.BulkDataURI);
			const bulkData = multipartDecode(await response.arrayBuffer());
			indexes = decodeValue(pointIndexList.vr, bulkData) as Uint32Array;
		}
	}

	// Decrement indexes by 1 to match the 0-based index
	indexes = indexes?.map((index) => index - 1);

	if (!points || points.length === 0) {
		return source;
	}

	const coordinates = [];
	let hasNegativeCoordinates = false;

	for (let i = 0; i < points.length; i += 2) {
		const [x, y] = [points[i], points[i + 1]];
		if (x < 0 || y < 0) hasNegativeCoordinates = true;
		coordinates.push([points[i], -points[i + 1]]);
	}

	if (hasNegativeCoordinates) {
		// eslint-disable-next-line no-console
		console.warn('Detected negative coordinates, some annotations may be out of bounds.');
	}

	if ((graphicType === 'POLYLINE' || graphicType === 'POLYGON') && !indexes) {
		// eslint-disable-next-line no-console
		console.warn('Missing indexes data for graphic type: ', graphicType);
	}

	switch (graphicType) {
		case 'POINT':
			source.addFeature(new Feature({ geometry: new MultiPoint(coordinates) }));
			break;
		case 'POLYLINE':
			for (let i = 0; i < indexes!.length; i++) {
				const coord = coordinates.slice(indexes![i], indexes![i + 1] || coordinates.length);
				if (coord && coord.length > 1) {
					source.addFeature(new Feature({ geometry: new LineString(coord) }));
				}
			}
			break;
		case 'POLYGON':
			for (let i = 0; i < indexes!.length; i++) {
				const start = Math.floor(indexes![i] / 2);
				const end = Math.floor(indexes![i + 1] / 2) || coordinates.length;
				const coord = coordinates.slice(start, end).concat([coordinates[start]]);
				if (coord && coord.length > 1) {
					source.addFeature(new Feature({ geometry: new Polygon([coord]) }));
				}
			}
			break;
		case 'ELLIPSE':
			for (let i = 0; i < coordinates.length; i += 4) {
				const coord = calculateEllipsePoints(coordinates.slice(i, i + 4));
				const polygon = new Polygon([coord]);
				source.addFeature(new Feature({ geometry: polygon }));
			}
			break;
		case 'RECTANGLE':
			for (let i = 0; i < coordinates.length; i += 4) {
				const polygon = new Polygon([coordinates.slice(i, i + 4).concat([coordinates[i]])]);
				source.addFeature(new Feature({ geometry: polygon }));
			}
			break;
		default:
			// eslint-disable-next-line no-console
			console.error('Unrecognized graphic type: ', graphicType);
	}

	return source;
}

/** An object holding the state of a single annotation group. */
export interface AnnotationConfig {
	loading: boolean;
	visible: boolean;
}

/** A map of annotation groups keyed by their UID. */
export interface AnnotationMap {
	series: {
		[seriesUid: string]: {
			dicomJson: DicomJson;
			groups: { [groupUid: string]: DicomJson };
		};
	};
	configs: {
		[seriesUid: string]: { [groupUid: string]: AnnotationConfig };
	};
}

/**
 * Fetches the annotations series for the current slide.
 *
 * @param server The DICOMweb server.
 * @param slide The current slide.
 * @returns The annotations series and their configurations.
 */
export function useAnnotations(server: DicomServer, slide: DicomJson | null) {
	const [annotations, setAnnotations] = useState<AnnotationMap>({ series: {}, configs: {} });
	const [refresh, setRefresh] = useState(false);

	useEffect(() => {
		async function loadAnnotations() {
			const annotationSeries = await fetchAnnotationSeries(server, slide);

			const annotations: AnnotationMap = { series: {}, configs: {} };

			for (const series of annotationSeries) {
				const seriesUid = series[DicomTag.SeriesInstanceUID]!.Value?.[0] as string;
				const groups = series[DicomTag.AnnotationGroupSequence]?.Value as DicomJson[];

				annotations.series[seriesUid] = { dicomJson: series, groups: {} };
				annotations.configs[seriesUid] = {};

				for (const group of groups || []) {
					const groupUid = group[DicomTag.AnnotationGroupUID]!.Value?.[0] as string;

					annotations.series[seriesUid].groups[groupUid] = group;
					annotations.configs[seriesUid][groupUid] = { loading: true, visible: true };
				}
			}

			setAnnotations(annotations);
		}

		loadAnnotations();
	}, [server, slide]);

	const updateAnnotation = useCallback((seriesUid: string, groupUid: string, update: Partial<AnnotationConfig>) => {
		setAnnotations((prevAnnotations) => {
			const newAnnotations = { ...prevAnnotations };
			if (newAnnotations.configs[seriesUid]?.[groupUid]) {
				newAnnotations.configs[seriesUid][groupUid] = {
					...newAnnotations.configs[seriesUid][groupUid],
					...update,
				};
			}
			return newAnnotations;
		});
	}, []);

	return [annotations, updateAnnotation] as const;
}

/**
 * Fetches the annotations series for the current slide.
 *
 * @param mapRef The reference to the OpenLayers map instance.
 * @param annotations The annotations states from the {@link useAnnotations} hook.
 * @param resolutions The resolutions of the instances keyed by their SOPInstanceUID.
 * @param updateAnnotation The function to update an annotation.
 * @returns The annotation layers.
 */
export function useAnnotationGroupLayers(
	mapRef: MutableRefObject<Map | null>,
	annotations: AnnotationMap,
	resolutions: Record<string, number>,
	updateAnnotation: (seriesUid: string, groupUid: string, update: Partial<AnnotationConfig>) => void,
) {
	const layers = useRef<VectorLayer<Feature<Geometry>>[]>([]);

	useEffect(() => {
		const map = mapRef.current;

		async function addAnnotationLayers() {
			if (!map || Object.keys(resolutions).length === 0) {
				return;
			}

			// Clear previous layers
			layers.current.forEach((layer) => map!.removeLayer(layer));
			layers.current = [];

			// Add new layers based on annotations
			for (const [seriesUid, { dicomJson, groups }] of Object.entries(annotations.series)) {
				const instanceUid = getReferenceInstanceUid(dicomJson);
				if (!instanceUid) continue;

				for (const [groupUid, group] of Object.entries(groups)) {
					if (!group) continue;

					const layer: VectorLayer<Feature<Geometry>> = new VectorLayer({ properties: { seriesUid, groupUid } });
					map.addLayer(layer);
					layers.current.push(layer);

					createAnnotationSource(instanceUid, group, resolutions)
						.then((source) => {
							layer.setSource(source);
							updateAnnotation(seriesUid, groupUid, { loading: false });
						})
						.catch((error) => {
							// eslint-disable-next-line no-console
							console.error('Failed to create annotation layer:', error);
						});
				}
			}
		}

		addAnnotationLayers();

		// Cleanup function to remove layers when the component unmounts or dependencies change
		return () => {
			if (map) {
				layers.current.forEach((layer) => map.removeLayer(layer));
			}
		};
	}, [mapRef, annotations.series, resolutions, updateAnnotation]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		layers.current.forEach((layer) => {
			const seriesUid = layer.getProperties().seriesUid;
			const groupUid = layer.getProperties().groupUid;

			const visible = annotations.configs[seriesUid]?.[groupUid]?.visible;
			layer.setVisible(visible);
		});
	}, [mapRef, annotations]);

	return layers;
}
