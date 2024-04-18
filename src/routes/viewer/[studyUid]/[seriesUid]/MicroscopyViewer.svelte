<script lang="ts">
	import 'ol/ol.css';
	import { MousePosition, defaults as defaultControls } from 'ol/control';
	import { TileDebug, XYZ } from 'ol/source';
	import Map from 'ol/Map.js';
	import { Projection } from 'ol/proj';
	import { TileGrid } from 'ol/tilegrid';
	import TileLayer from 'ol/layer/Tile.js';
	import View from 'ol/View.js';
	import { createStringXY } from 'ol/coordinate';
	import { getCenter } from 'ol/extent';
	import { onMount } from 'svelte';
	import { toDicomWebUrl } from '$lib/dicom-web';

	import type { ImagingInfo } from '$lib/dicom-web/series';

	export let studyUid: string;

	export let seriesUid: string;

	export let images: ImagingInfo[];

	onMount(async () => {
		const biggestImage = images[0]!;
		const isImplicitTileGrid = images.length > 1 || !biggestImage.imageType.includes('VOLUME');
		const extent = [0, 0, biggestImage.totalPixelMatrixColumns, biggestImage.totalPixelMatrixRows];
		const [minZoom, maxZoom] = [0, Object.keys(images).length - 1];
		const tileSize = [biggestImage.columns, biggestImage.columns];
		const projection = new Projection({ code: 'DICOM', units: 'pixels', extent });

		// prettier-ignore
		const tileGridConfig = isImplicitTileGrid ? {} : {
			tileGrid: new TileGrid({
				resolutions: Array.from({ length: images.length }, (_, i) => 2 ** i).reverse(),
				sizes: [new Array(2).fill(Math.ceil(Math.sqrt(biggestImage.numberOfFrames)))],
				extent,
				tileSize,
			})
		};

		const map = new Map({
			target: 'map',
			controls: defaultControls().extend([
				new MousePosition({ coordinateFormat: createStringXY(4), projection: 'DICOM' }),
			]),
			layers: [
				new TileLayer({
					source: new XYZ({
						tileUrlFunction: ([z, x, y]: number[]) => {
							const { instanceUID, totalPixelMatrixColumns, columns } = images[z]!;
							const frame = x + y * Math.ceil(totalPixelMatrixColumns / columns) + 1;
							return toDicomWebUrl({
								studyUid: studyUid,
								seriesUid: seriesUid,
								instanceUid: instanceUID,
								frame: frame,
								pathname: '/rendered',
							});
						},
						minZoom,
						maxZoom,
						projection,
						tileSize,
						...tileGridConfig,
					}),
					extent,
					minZoom,
				}),
				new TileLayer({ source: new TileDebug({ projection, ...tileGridConfig }), extent, minZoom, maxZoom }),
			],
			view: new View({ center: getCenter(extent), extent, projection, showFullExtent: true, zoom: 2 }),
		});

		map.getView().fit(extent);
	});
</script>

<div id="map" class="h-full w-full" />
