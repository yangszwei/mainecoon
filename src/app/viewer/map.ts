import { DicomTag, fetchDicomJson, toDicomWebUri } from '@/lib/dicom-web';
import { Map, View } from 'ol';
import { MousePosition, OverviewMap, ScaleLine, defaults as defaultControls } from 'ol/control';
import { useEffect, useRef, useState } from 'react';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import { Projection } from 'ol/proj';
import { TileGrid } from 'ol/tilegrid';
import TileLayer from 'ol/layer/WebGLTile';
import { XYZ } from 'ol/source';
import { getCenter } from 'ol/extent';

/**
 * Fetches the image instances for the current slide.
 *
 * @param server The DICOMweb server to fetch the images from.
 * @param slide The series metadata of the current slide.
 */
function fetchImages(server: DicomServer, slide: DicomJson) {
	/** The options to select the current series. */
	const seriesOptions = {
		baseUrl: server.url,
		studyUid: slide[DicomTag.StudyInstanceUID].Value?.[0] as string,
		seriesUid: slide[DicomTag.SeriesInstanceUID].Value?.[0] as string,
	};

	/** Sorts the image instances by their size. */
	const sortImagingInfo = (a: DicomJson | undefined, b: DicomJson | undefined) => {
		if (!a || !b) return 0;
		const aTotalPixelMatrixColumns = a[DicomTag.TotalPixelMatrixColumns].Value?.[0] as number;
		const aTotalPixelMatrixRows = a[DicomTag.TotalPixelMatrixRows].Value?.[0] as number;
		const aNumberOfFrames = a[DicomTag.NumberOfFrames].Value?.[0] as number;
		const bTotalPixelMatrixColumns = b[DicomTag.TotalPixelMatrixColumns].Value?.[0] as number;
		const bTotalPixelMatrixRows = b[DicomTag.TotalPixelMatrixRows].Value?.[0] as number;
		const bNumberOfFrames = b[DicomTag.NumberOfFrames].Value?.[0] as number;
		const aSize = aTotalPixelMatrixColumns * aTotalPixelMatrixRows;
		const bSize = bTotalPixelMatrixColumns * bTotalPixelMatrixRows;
		return aSize === bSize ? aNumberOfFrames - bNumberOfFrames : aSize - bSize;
	};

	return fetchDicomJson({ ...seriesOptions, name: 'instances' })
		.then((data) => data.map((instance) => instance[DicomTag.SOPInstanceUID].Value?.[0] as string))
		.then((data) => data.map((instanceUid) => fetchDicomJson({ ...seriesOptions, instanceUid, name: 'metadata' })))
		.then((data) => Promise.all(data).then((data) => data.map((d) => d[0])))
		.then((data) => ({
			label: data.find((d) => d[DicomTag.ImageType].Value?.includes('LABEL')) || null,
			overview: data.find((d) => d[DicomTag.ImageType].Value?.includes('OVERVIEW')) || null,
			thumbnail: data.find((d) => d[DicomTag.ImageType].Value?.includes('THUMBNAIL')) || null,
			volumes: data.filter((d) => d[DicomTag.ImageType].Value?.includes('VOLUME')).sort(sortImagingInfo),
		}));
}

/**
 * Extracts value of Pixel Spacing attribute from metadata.
 *
 * @private
 * @param {object} metadata - Metadata of a DICOM VL Whole Slide Microscopy Image instance
 * @returns {number[]} Spacing between pixel columns and rows in millimeter
 */
function getPixelSpacing(metadata: DicomJson) {
	const functionalGroup = metadata[DicomTag.SharedFunctionalGroupsSequence].Value?.[0] as DicomJson | undefined;
	const pixelMeasures = functionalGroup?.[DicomTag.PixelMeasuresSequence]?.Value?.[0] as DicomJson | undefined;
	if (!pixelMeasures) return [1, 1];

	return [
		Number(pixelMeasures[DicomTag.PixelSpacing]?.Value?.[0]) || 1,
		Number(pixelMeasures[DicomTag.PixelSpacing]?.Value?.[1]) || 1,
	];
}

/**
 * Computes the information needed to display the pyramid with the volume images.
 *
 * @param images The volume images.
 * @returns The pyramid information.
 */
function computePyramidInfo(images: DicomJson[]) {
	const tileSizes = [];
	const gridSizes = [];
	const resolutions = [];
	const origins = [];
	const pixelSpacings = [];
	const imageSizes = [];
	const physicalSizes = [];
	const offset = [0, -1];

	/** The resolutions keyed by the instance UID. */
	const instanceResolutions: Record<string, number> = {};

	const baseImage = images[images.length - 1];
	const baseTotalPixelMatrixColumns = baseImage[DicomTag.TotalPixelMatrixColumns].Value?.[0] as number;
	const baseTotalPixelMatrixRows = baseImage[DicomTag.TotalPixelMatrixRows].Value?.[0] as number;

	for (let j = images.length - 1; j >= 0; j--) {
		const image = images[j];
		const instanceUid = image[DicomTag.SOPInstanceUID].Value?.[0] as string;
		const columns = image[DicomTag.Columns].Value?.[0] as number;
		const rows = image[DicomTag.Rows].Value?.[0] as number;
		const totalPixelMatrixColumns = image[DicomTag.TotalPixelMatrixColumns].Value?.[0] as number;
		const totalPixelMatrixRows = image[DicomTag.TotalPixelMatrixRows].Value?.[0] as number;
		const pixelSpacing = getPixelSpacing(image) || [1, 1];

		const nColumns = Math.ceil(totalPixelMatrixColumns / columns);
		const nRows = Math.ceil(totalPixelMatrixRows / rows);

		tileSizes.push([columns, rows]);
		gridSizes.push([nColumns, nRows]);
		pixelSpacings.push(pixelSpacing);

		imageSizes.push([totalPixelMatrixColumns, totalPixelMatrixRows]);
		physicalSizes.push([
			(totalPixelMatrixColumns * pixelSpacing[1]).toFixed(4),
			(totalPixelMatrixRows * pixelSpacing[0]).toFixed(4),
		]);

		const zoomFactor = Math.round(baseTotalPixelMatrixColumns / totalPixelMatrixColumns);
		resolutions.push(zoomFactor);
		instanceResolutions[instanceUid] = zoomFactor;

		origins.push(offset);
	}

	resolutions.reverse();
	tileSizes.reverse();
	gridSizes.reverse();
	origins.reverse();
	pixelSpacings.reverse();
	imageSizes.reverse();
	physicalSizes.reverse();

	return {
		resolutions,
		tileSizes,
		gridSizes,
		origins,
		pixelSpacings,
		imageSizes,
		physicalSizes,
		instanceResolutions,
		baseTotalPixelMatrixColumns,
		baseTotalPixelMatrixRows,
	};
}

/**
 * Loads a map with the volume images of the current slide.
 *
 * @param id The ID of the map element.
 * @param server The DICOMweb server.
 * @param slide The series metadata of the current slide.
 * @returns The map reference, the resolutions, and the loading state.
 */
export function useMap(id: string, server: DicomServer, slide: DicomJson | null) {
	const mapRef = useRef<Map | null>(null);
	const [resolutions, setResolutions] = useState<{ [instanceUid: string]: number }>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadMap() {
			if (!server || !slide) return;

			// Create the map if it doesn't exist yet
			if (!mapRef.current) {
				mapRef.current = new Map({ target: id });
			}

			const images = await fetchImages(server, slide);
			const pyramidInfo = computePyramidInfo(images.volumes);

			const extent = [0, -(pyramidInfo.baseTotalPixelMatrixRows + 1), pyramidInfo.baseTotalPixelMatrixColumns, -1];

			const projection = new Projection({
				code: 'DICOM',
				units: 'm',
				global: true,
				extent: extent,
				getPointResolution: (resolution: number, point: number[]) => {
					return (resolution * pyramidInfo.pixelSpacings[pyramidInfo.pixelSpacings.length - 1][0]) / 10 ** 3;
				},
			});

			const tileGrid = new TileGrid({
				extent: extent,
				origins: pyramidInfo.origins,
				resolutions: pyramidInfo.resolutions,
				sizes: pyramidInfo.gridSizes,
				tileSizes: pyramidInfo.tileSizes,
			});

			const baseUrl = server.url;
			const studyUid = slide[DicomTag.StudyInstanceUID].Value?.[0] as string;
			const seriesUid = slide[DicomTag.SeriesInstanceUID].Value?.[0] as string;

			const layer = new TileLayer({
				source: new XYZ({
					tileUrlFunction: ([z, x, y]: number[]) => {
						const image = images.volumes[z];
						const instanceUid = image[DicomTag.SOPInstanceUID].Value?.[0] as string;
						const totalPixelMatrixColumns = image[DicomTag.TotalPixelMatrixColumns].Value?.[0] as number;
						const columns = image[DicomTag.Columns].Value?.[0] as number;
						const frameNumber = x + y * Math.ceil(totalPixelMatrixColumns / columns) + 1;
						return toDicomWebUri({ baseUrl, studyUid, seriesUid, instanceUid, frameNumber, name: 'rendered' });
					},
					tileGrid: tileGrid,
					projection: projection,
					wrapX: false,
					maxZoom: pyramidInfo.resolutions.length - 1,
					minZoom: 0,
				}),
				extent: extent,
				visible: true,
				useInterimTilesOnError: false,
			});

			const view = new View({
				center: getCenter(extent),
				projection: projection,
				resolutions: pyramidInfo.resolutions,
				constrainOnlyCenter: false,
				smoothResolutionConstraint: true,
				showFullExtent: true,
				extent: extent,
				zoom: 0,
			});

			const controls = [
				...defaultControls().getArray(),
				new MousePosition({
					coordinateFormat: (c: number[] | undefined) => (c ? `(${c[0].toFixed(2)}, ${-c[1].toFixed(2)})` : ''),
					className: 'absolute left-auto right-0 m-2 rounded-sm bg-white/75 px-1 py-0.5 text-xs font-medium',
				}),
				new OverviewMap({
					collapsed: false,
					layers: [new TileLayer({ source: layer.getSource() ?? undefined })],
				}),
				new ScaleLine({
					units: 'metric',
					className: 'ol-scale-line',
				}),
			];

			// Set the layers and view for the current slide
			mapRef.current.setLayers([layer]);
			mapRef.current.setView(view);

			// Replace the controls with the new ones
			mapRef.current.getControls().clear();
			controls.forEach((control) => mapRef.current!.addControl(control));

			// Set the loading state
			mapRef.current.on('loadstart', () => setLoading(true));
			mapRef.current.on('loadend', () => setLoading(false));

			// Pass the resolutions to the parent component (used to render the annotations)
			setResolutions(pyramidInfo.instanceResolutions);
		}

		loadMap();
	}, [id, server, slide]);

	return [mapRef, resolutions, loading] as const;
}
