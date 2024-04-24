import { Projection } from 'ol/proj';
import { TileGrid } from 'ol/tilegrid';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { XYZ } from 'ol/source';
import { getCenter } from 'ol/extent';
import { toDicomWebUrl } from '$lib/dicom-web';

import type { ImagingInfo } from '$lib/dicom-web/series';

export const computePyramidInfo = (baseUrl: string, studyUid: string, seriesUid: string, images: ImagingInfo[]) => {
	const pyramidTileSizes = [];
	const pyramidGridSizes = [];
	const pyramidResolutions = [];
	const pyramidOrigins = [];
	const pyramidPixelSpacings = [];
	const pyramidImageSizes = [];
	const pyramidPhysicalSizes = [];
	const offset = [0, -1];
	const baseTotalPixelMatrixColumns = images[images.length - 1].totalPixelMatrixColumns;
	const baseTotalPixelMatrixRows = images[images.length - 1].totalPixelMatrixRows;

	for (let j = images.length - 1; j >= 0; j--) {
		const image = images[j];
		const columns = image.columns;
		const rows = image.rows;
		const totalPixelMatrixColumns = image.totalPixelMatrixColumns;
		const totalPixelMatrixRows = image.totalPixelMatrixRows;
		const pixelSpacing = [1, 1]; // Replace with actual pixel spacing if available

		const nColumns = Math.ceil(totalPixelMatrixColumns / columns);
		const nRows = Math.ceil(totalPixelMatrixRows / rows);

		pyramidTileSizes.push([columns, rows]);
		pyramidGridSizes.push([nColumns, nRows]);
		pyramidPixelSpacings.push(pixelSpacing);

		pyramidImageSizes.push([totalPixelMatrixColumns, totalPixelMatrixRows]);
		pyramidPhysicalSizes.push([
			(totalPixelMatrixColumns * pixelSpacing[1]).toFixed(4),
			(totalPixelMatrixRows * pixelSpacing[0]).toFixed(4),
		]);

		const zoomFactor = Math.round(baseTotalPixelMatrixColumns / totalPixelMatrixColumns);
		pyramidResolutions.push(zoomFactor);

		pyramidOrigins.push(offset);
	}

	pyramidResolutions.reverse();
	pyramidTileSizes.reverse();
	pyramidGridSizes.reverse();
	pyramidOrigins.reverse();
	pyramidPixelSpacings.reverse();
	pyramidImageSizes.reverse();
	pyramidPhysicalSizes.reverse();

	const extent = [0, -(baseTotalPixelMatrixRows + 1), baseTotalPixelMatrixColumns, -1];
	const projection = new Projection({ code: 'DICOM', units: 'm', global: true, extent: extent });

	const tileGrid = new TileGrid({
		extent: extent,
		origins: pyramidOrigins,
		resolutions: pyramidResolutions,
		sizes: pyramidGridSizes,
		tileSizes: pyramidTileSizes,
	});

	const layer = new TileLayer({
		source: new XYZ({
			tileUrlFunction: ([z, x, y]: number[]) => {
				const { instanceUID, totalPixelMatrixColumns, columns } = images[z]!;
				const frame = x + y * Math.ceil(totalPixelMatrixColumns / columns) + 1;
				return toDicomWebUrl({
					baseUrl: baseUrl,
					studyUid: studyUid,
					seriesUid: seriesUid,
					instanceUid: instanceUID,
					frame: frame,
					pathname: '/rendered',
				});
			},
			tileGrid: tileGrid,
			projection: projection,
			wrapX: false,
			maxZoom: pyramidResolutions.length - 1,
			minZoom: 0,
		}),
		extent: extent,
		visible: true,
		useInterimTilesOnError: false,
	});

	const view = new View({
		center: getCenter(extent),
		projection: projection,
		resolutions: pyramidResolutions, // FIXME
		constrainOnlyCenter: false,
		smoothResolutionConstraint: true,
		showFullExtent: true,
		extent: extent,
		zoom: 2,
	});

	return { extent, layer, view };
};
