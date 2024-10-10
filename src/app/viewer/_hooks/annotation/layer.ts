import type * as ol from 'ol';
import type { Annotation, AnnotationMap, AnnotationMapAction } from './index';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import { Draw, Interaction } from 'ol/interaction';
import { Geometry, MultiLineString, MultiPoint, MultiPolygon, Polygon } from 'ol/geom';
import { useEffect, useRef } from 'react';
import { DicomTag } from '@/lib/dicom-web';
import { Feature } from 'ol';
import type { GeometryFunction } from 'ol/interaction/Draw';
import { GraphicType } from './index';
import type { MutableRefObject } from 'react';
import type { Type } from 'ol/geom/Geometry';
import VectorImageLayer from 'ol/layer/VectorImage';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { createBox } from 'ol/interaction/Draw';
import { decodeValue } from '@/lib/dicom-web/vr';
import { imageLayerThreshold } from '@/lib/constants';
import { multipartDecode } from '@/lib/utils/multipart';

type AnnotationLayer = VectorLayer | VectorImageLayer<Feature<Geometry>>;

export function useAnnotationLayers(
	mapRef: MutableRefObject<ol.Map | null>,
	annotationMap: AnnotationMap,
	updateAnnotationMap: (action: AnnotationMapAction) => void,
	currentAnnotation: Annotation | null,
	drawTypeState: [GraphicType | null, (drawType: GraphicType | null) => void],
	resolutions: { [seriesUid: string]: number },
) {
	const annotationLayersRef = useRef<AnnotationLayer[]>([]);
	const drawInteractionRef = useRef<Interaction | null>(null);
	const [drawType, setDrawType] = drawTypeState;

	useEffect(() => {
		const map = mapRef.current;
		const annotationLayers = annotationLayersRef.current;

		if (!map) {
			return;
		}

		// Remove all annotation layers when the map is removed
		return () => {
			map.dispose();
			annotationLayers.length = 0;
			updateAnnotationMap({ type: 'refresh' });
		};
	}, [mapRef, updateAnnotationMap]);

	useEffect(() => {
		if (!mapRef.current || !annotationMap || !Object.keys(resolutions).length) {
			return;
		}

		// Remove layers that are no longer in the annotation map
		for (const layer of annotationLayersRef.current) {
			const { seriesUid, groupUid } = layer.getProperties();
			if (!annotationMap[seriesUid]?.groupMap?.[groupUid]) {
				layer.dispose();
				mapRef.current.removeLayer(layer);
				annotationLayersRef.current = annotationLayersRef.current.filter((l) => l !== layer);
			}
		}

		// Add layers for new annotation groups
		for (const [seriesUid, series] of Object.entries(annotationMap)) {
			for (const [groupUid, group] of Object.entries(series.groupMap)) {
				let layer = annotationLayersRef.current.find((layer) => {
					const { seriesUid: s, groupUid: g } = layer.getProperties();
					return s === seriesUid && g === groupUid;
				});

				// Create a new layer if it doesn't exist
				if (!layer) {
					if (group.numberOfAnnotations > imageLayerThreshold) {
						layer = new VectorImageLayer({
							source: new VectorSource({ wrapX: false }),
							imageRatio: Object.keys(resolutions).length / 2,
							properties: { groupUid, seriesUid },
							style: createStyle(group.color),
						});
					} else {
						layer = new VectorLayer({
							source: new VectorSource({ wrapX: false }),
							properties: { groupUid, seriesUid },
							style: createStyle(group.color),
						});
					}

					annotationLayersRef.current.push(layer);
				}

				// Add layer if it's not already added
				if (!mapRef.current.getLayers().getArray().includes(layer)) {
					mapRef.current.addLayer(layer);
				}

				// Fetch the annotation source if it's not ready
				if (group.status === 'initialized') {
					updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { status: 'loading' } });
					fetchAnnotationSource(group, layer.getSource(), resolutions[series.referenceInstanceUid!] || 1)
						.then(() => updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { status: 'ready' } }))
						.catch(() => updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { status: 'error' } }));
				}

				// Update the layer color
				layer.setStyle(createStyle(group.color));

				// Update the layer visibility
				layer.setVisible(group.visible);
			}
		}
	}, [mapRef, annotationMap, updateAnnotationMap, resolutions]);

	// Create a draw interaction for the active annotation group
	useEffect(() => {
		const map = mapRef.current;

		const activeLayer = annotationLayersRef.current.find((layer) => {
			const { seriesUid, groupUid } = layer.getProperties();
			return currentAnnotation?.seriesUid === seriesUid && currentAnnotation?.groupUid === groupUid;
		});

		if (!map || !currentAnnotation || !activeLayer || !drawType) {
			return;
		}

		// Remove any existing draw interaction
		if (drawInteractionRef.current) {
			map.removeInteraction(drawInteractionRef.current);
		}

		const olDrawTypes: Record<GraphicType, { type: Type; geometryFunction?: GeometryFunction }> = {
			[GraphicType.Point]: { type: 'Point' },
			[GraphicType.Polyline]: { type: 'LineString' },
			[GraphicType.Polygon]: { type: 'Polygon' },
			[GraphicType.Ellipse]: { type: 'Circle', geometryFunction: createEllipse() },
			[GraphicType.Rectangle]: { type: 'Circle', geometryFunction: createBox() },
		};

		// Create a new draw interaction for freehand drawing
		const drawInteraction = new Draw({
			source: activeLayer.getSource() || undefined,
			type: olDrawTypes[drawType].type,
			geometryFunction: olDrawTypes[drawType].geometryFunction,
			freehand: true,
			style: createDrawingStyle(currentAnnotation.color),
		});

		map.addInteraction(drawInteraction);
		drawInteractionRef.current = drawInteraction;

		// Clean up the draw interaction when the component unmounts or activeLayer changes
		return () => {
			map.removeInteraction(drawInteraction);
		};
	}, [mapRef, currentAnnotation, drawType, setDrawType]);
}

async function fetchAnnotationSource(group: Annotation, source: VectorSource | null, resolution: number) {
	if (!group || !group.dicomJson || !source) {
		return;
	}

	const pointCoordinatesData = group.dicomJson[DicomTag.PointCoordinatesData];
	const pointIndexList = group.dicomJson[DicomTag.LongPrimitivePointIndexList];

	let points: Float64Array | Float32Array | undefined;
	let indexes: Uint32Array | undefined;

	if (pointCoordinatesData) {
		if (pointCoordinatesData.InlineBinary) {
			points = decodeValue(pointCoordinatesData.vr, pointCoordinatesData.InlineBinary) as Float64Array | Float32Array;
		} else if (pointCoordinatesData.BulkDataURI) {
			// Fetch the bulk data URI
			const response = await fetch(pointCoordinatesData.BulkDataURI);
			const bulkData = multipartDecode(await response.arrayBuffer());
			const vr = pointCoordinatesData.vr === 'UR' ? 'OF' : pointCoordinatesData.vr;
			points = decodeValue(vr, bulkData) as Float64Array | Float32Array;
		}
	}

	points = points?.map((point) => point * resolution);

	if (pointIndexList) {
		if (pointIndexList.InlineBinary) {
			indexes = decodeValue(pointIndexList.vr, pointIndexList.InlineBinary) as Uint32Array;
		} else if (pointIndexList.BulkDataURI) {
			// Fetch the bulk data URI
			const response = await fetch(pointIndexList.BulkDataURI);
			const bulkData = multipartDecode(await response.arrayBuffer());
			const vr = pointIndexList.vr === 'UR' ? 'OL' : pointIndexList.vr;
			indexes = decodeValue(vr, bulkData) as Uint32Array;
		}
	}

	// Decrement indexes by 1 to match the 0-based index
	indexes = indexes?.map((index) => index - 1);

	if (!points || points.length === 0) {
		return;
	}

	const coordinates = [];
	let hasNegativeCoordinates = false;

	for (let i = 0; i < points.length; i += 2) {
		const [x, y] = [points[i], points[i + 1]];
		coordinates.push([points[i], -points[i + 1]]);
	}

	if (hasNegativeCoordinates) {
		// eslint-disable-next-line no-console
		console.warn('Detected negative coordinates, some annotations may be out of bounds.');
	}

	if ((group.graphicType === 'POLYLINE' || group.graphicType === 'POLYGON') && !indexes) {
		// eslint-disable-next-line no-console
		console.warn('Missing indexes data for graphic type: ', group.graphicType);
	}

	switch (group.graphicType) {
		case 'POINT':
			source.addFeature(new Feature({ geometry: new MultiPoint(coordinates) }));
			break;
		case 'POLYLINE': {
			let lineStringCoords = [];
			for (let i = 0; i < indexes!.length; i++) {
				const coord = coordinates.slice(indexes![i], indexes![i + 1] || coordinates.length);
				if (coord && coord.length > 1) {
					lineStringCoords.push(coord);
					if (lineStringCoords.length > 10000) {
						source.addFeature(new Feature({ geometry: new MultiLineString(lineStringCoords) }));
						lineStringCoords = [];
					}
				}
			}
			if (lineStringCoords.length > 0) {
				source.addFeature(new Feature({ geometry: new MultiLineString(lineStringCoords) }));
			}
			break;
		}
		case 'POLYGON': {
			let polygonCoords = [];
			for (let i = 0; i < indexes!.length; i++) {
				const start = Math.floor(indexes![i] / 2);
				const end = Math.floor(indexes![i + 1] / 2) || coordinates.length;
				const coord = coordinates.slice(start, end).concat([coordinates[start]]);
				if (coord && coord.length > 1) {
					polygonCoords.push([coord]);
					if (polygonCoords.length > 10000) {
						source.addFeature(new Feature({ geometry: new MultiPolygon(polygonCoords) }));
						polygonCoords = [];
					}
				}
			}
			if (polygonCoords.length > 0) {
				source.addFeature(new Feature({ geometry: new MultiPolygon(polygonCoords) }));
			}
			break;
		}
		case 'ELLIPSE': {
			let ellipseCoords = [];
			for (let i = 0; i < coordinates.length; i += 4) {
				const coord = calculateEllipsePoints(coordinates.slice(i, i + 4));
				ellipseCoords.push([coord]);
				if (ellipseCoords.length > 10000) {
					source.addFeature(new Feature({ geometry: new MultiPolygon(ellipseCoords) }));
					ellipseCoords = [];
				}
			}
			if (ellipseCoords.length > 0) {
				source.addFeature(new Feature({ geometry: new MultiPolygon(ellipseCoords) }));
			}
			break;
		}
		case 'RECTANGLE': {
			let rectangleCoords = [];
			for (let i = 0; i < coordinates.length; i += 4) {
				const coord = coordinates.slice(i, i + 4).concat([coordinates[i]]);
				rectangleCoords.push([coord]);
				if (rectangleCoords.length > 10000) {
					source.addFeature(new Feature({ geometry: new MultiPolygon(rectangleCoords) }));
					rectangleCoords = [];
				}
			}
			if (rectangleCoords.length > 0) {
				source.addFeature(new Feature({ geometry: new MultiPolygon(rectangleCoords) }));
			}
			break;
		}
		default:
			// eslint-disable-next-line no-console
			console.error('Unrecognized graphic type: ', group.graphicType);
	}
}

const createEllipse = (): GeometryFunction => {
	return (coordinates, geometry) => {
		if (!geometry) {
			geometry = new Polygon([]);
		}

		const [center, end] = coordinates as [number[], number[]];
		const radiusX = Math.abs(end[0] - center[0]);
		const radiusY = Math.abs(end[1] - center[1]);
		const numPoints = 64;
		const angleStep = (2 * Math.PI) / numPoints;
		const ellipseCoords = [];

		for (let i = 0; i < numPoints; i++) {
			const angle = i * angleStep;
			const x = center[0] + radiusX * Math.cos(angle);
			const y = center[1] + radiusY * Math.sin(angle);
			ellipseCoords.push([x, y]);
		}

		ellipseCoords.push(ellipseCoords[0]); // close the polygon

		(geometry as Polygon).setCoordinates([ellipseCoords]);
		return geometry;
	};
};

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
 * Creates the feature style for the annotation group layer.
 *
 * @param color The color to use for the feature style.
 * @returns The OpenLayers style object.
 */
function createStyle(color: string) {
	const fill = new Fill({ color: 'rgba(255,255,255,0.4)' });
	const stroke = new Stroke({ color, width: 1.25 });
	const circle = new Circle({ fill, stroke, radius: 5 });
	return new Style({ image: circle, fill, stroke });
}

/**
 * Creates the drawing style for the annotation group layer.
 *
 * @param color The color to use for the drawing style.
 * @returns The OpenLayers style object.
 */
function createDrawingStyle(color: string) {
	return {
		'circle-radius': 5,
		'circle-fill-color': color,
		'stroke-color': color,
		'stroke-width': 2,
		'fill-color': 'rgba(255,255,255,0.4)',
	};
}
