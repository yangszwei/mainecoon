<script lang="ts">
	import 'ol/ol.css';
	import { OverviewMap, defaults as defaultControls } from 'ol/control';
	import { Map } from 'ol';
	import MousePosition from 'ol/control/MousePosition.js';
	import TileLayer from 'ol/layer/Tile';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import { computeAnnotationFeatures } from '$lib/microscopy-viewer/annotation';
	import { computePyramidInfo } from '$lib/microscopy-viewer/pyramid';
	import { onMount } from 'svelte';

	import type { AnnotationInfo, ImagingInfo } from '$lib/dicom-web/series';

	export let baseUrl: string;

	export let studyUid: string;

	export let seriesUid: string;

	export let images: ImagingInfo[];

	export let annotations: AnnotationInfo[];

	let loading = false;
	let errorMessage: string | undefined;

	// Show loading indicator if there are annotations to load
	$: loading = annotations.length > 0;

	onMount(() => {
		if (images.length === 0) {
			loading = false;
			errorMessage = 'No images found.';
			return;
		}

		let map: Map;

		try {
			const { extent, layer, resolutions, view } = computePyramidInfo(baseUrl, studyUid, seriesUid, images);

			map = new Map({
				controls: defaultControls().extend([
					new MousePosition({
						coordinateFormat: (c: number[] | undefined) => (c ? `${c[0].toFixed(2)}, ${-c[1].toFixed(2)}` : ''),
						className: 'm-1.5 text-center text-sm',
					}),
					new OverviewMap({
						layers: [new TileLayer({ source: layer.getSource() ?? undefined })],
					}),
				]),
				target: 'map',
				layers: [layer],
				view,
			});

			computeAnnotationFeatures(annotations, resolutions)
				.then((features) => {
					if (features.length > 0) {
						const source = new VectorSource({ features });
						map.addLayer(new VectorLayer({ source, extent }));
					}
				})
				.catch((error) => {
					errorMessage = 'Failed to load annotations.';
					console.error(error); // eslint-disable-line no-console
				})
				.finally(() => (loading = false));

			map.getView().fit(extent, { size: map.getSize() });
		} catch (error) {
			errorMessage = 'Unexpected error occurred.';
			loading = false;
			console.error(error); // eslint-disable-line no-console
		}
	});
</script>

<div class="relative h-full w-full overflow-hidden {$$props.class ?? ''}">
	<div id="map" class="h-full w-full" />
	<div class="absolute left-1/2 -translate-x-1/2 transition-all duration-300 {loading ? 'bottom-2' : '-bottom-8'}">
		<div class="flex items-center gap-3 rounded-full border bg-white/75 px-2 py-1 text-xs shadow">
			<span class="loader h-4 w-4 border-2 border-green-500" />
			<p>Loading Annotations...</p>
		</div>
	</div>
	<div class="absolute inset-0 z-10 flex items-center justify-center bg-black/40" class:hidden={!errorMessage}>
		<p>{errorMessage}</p>
	</div>
</div>
