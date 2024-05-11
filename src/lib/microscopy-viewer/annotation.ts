import { Geometry, LineString, MultiPoint, Polygon } from 'ol/geom';
import { Feature } from 'ol';
import { multipartDecode } from '$lib/utils/multipart';

import type { AnnotationInfo } from '$lib/dicom-web/series';

const decodeCoordinatesData = (encodedData: string | ArrayBuffer[], vr: string) => {
	let buffer;

	if (typeof encodedData === 'string') {
		const decodedData = atob(encodedData);

		const byteArray = new Uint8Array(decodedData.length);
		for (let i = 0; i < decodedData.length; i++) {
			byteArray[i] = decodedData.charCodeAt(i);
		}

		buffer = byteArray.buffer;
	} else {
		buffer = encodedData[0];
	}

	if (vr === 'OD') {
		return new Float64Array(buffer);
	}

	return new Float32Array(buffer);
};

const decodeIndexesData = (encodedData: string | ArrayBuffer[]) => {
	let buffer;

	if (typeof encodedData === 'string') {
		const decodedData = atob(encodedData);

		const byteArray = new Uint8Array(decodedData.length);
		for (let i = 0; i < decodedData.length; i++) {
			byteArray[i] = decodedData.charCodeAt(i);
		}

		buffer = byteArray.buffer;
	} else {
		buffer = encodedData[0];
	}

	return new Uint32Array(buffer);
};

const calculateEllipsePoints = (points: number[][]) => {
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
};

interface InstanceResolution {
	instanceUID: string;
	resolution: number;
}

export const computeAnnotationFeatures = async (annotations: AnnotationInfo[], resolutions: InstanceResolution[]) => {
	const features: Feature<Geometry>[] = [];

	if (annotations.length === 0) {
		return [];
	}

	for (const { instanceUID, pointsData, indexesData, graphicType } of annotations ?? []) {
		let points: Float64Array | Float32Array | undefined;
		let indexes: Uint32Array | undefined;

		if (pointsData.inlineBinary) {
			points = decodeCoordinatesData(pointsData.inlineBinary, pointsData.vr);
		} else if (pointsData.uri) {
			const response = await fetch(pointsData.uri);
			points = decodeCoordinatesData(multipartDecode(await response.arrayBuffer()), pointsData.vr);
		}

		let referencedResolution = resolutions.find((res) => res.instanceUID === instanceUID)?.resolution;
		if (!referencedResolution) {
			referencedResolution = resolutions[resolutions.length - 1].resolution;
			// eslint-disable-next-line no-console
			console.warn(`The referenced instance "${instanceUID}" could not be found, using the highest resolution.`);
		}

		points = points?.map((point) => point * referencedResolution);

		if (indexesData) {
			if (indexesData.inlineBinary) {
				indexes = decodeIndexesData(indexesData.inlineBinary);
			} else if (indexesData.uri) {
				const response = await fetch(indexesData.uri);
				indexes = decodeIndexesData(multipartDecode(await response.arrayBuffer()));
			}
		}

		// Decrement indexes by 1 to match the 0-based index
		indexes = indexes?.map((index) => index - 1);

		if (!points || points.length === 0) {
			continue;
		}

		const coordinates = [];

		for (let i = 0; i < points.length; i += 2) {
			coordinates.push([points[i], -points[i + 1]]);
		}

		if ((graphicType === 'POLYLINE' || graphicType === 'POLYGON') && !indexes) {
			// eslint-disable-next-line no-console
			console.warn('Missing indexes data for graphic type: ', graphicType);
			continue;
		}

		switch (graphicType) {
			case 'POINT':
				features.push(new Feature({ geometry: new MultiPoint(coordinates) }));
				break;
			case 'POLYLINE':
				for (let i = 0; i < indexes!.length; i++) {
					const coord = coordinates.slice(indexes![i], indexes![i + 1] || coordinates.length);
					if (coord && coord.length > 1) {
						features.push(new Feature({ geometry: new LineString(coord) }));
					}
				}
				break;
			case 'POLYGON':
				for (let i = 0; i < indexes!.length; i++) {
					const start = Math.floor(indexes![i] / 2);
					const end = Math.floor(indexes![i + 1] / 2) || coordinates.length;
					const coord = coordinates.slice(start, end).concat([coordinates[start]]);
					if (coord && coord.length > 1) {
						features.push(new Feature({ geometry: new Polygon([coord]) }));
					}
				}
				break;
			case 'ELLIPSE':
				for (let i = 0; i < coordinates.length; i += 4) {
					const coord = calculateEllipsePoints(coordinates.slice(i, i + 4));
					const polygon = new Polygon([coord]);
					features.push(new Feature({ geometry: polygon }));
				}
				break;
			case 'RECTANGLE':
				for (let i = 0; i < coordinates.length; i += 4) {
					const polygon = new Polygon([coordinates.slice(i, i + 4).concat([coordinates[i]])]);
					features.push(new Feature({ geometry: polygon }));
				}
				break;
			default:
				// eslint-disable-next-line no-console
				console.error('Unrecognized graphic type: ', graphicType);
		}
	}

	return features;
};
