<script lang="ts">
	import { Map } from 'ol';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import { computeAnnotationFeatures } from '$lib/microscopy-viewer/annotation';
	import { computePyramidInfo } from '$lib/microscopy-viewer/pyramid';
	import { onMount } from 'svelte';

	import type { AnnotationInfo, ImagingInfo } from '$lib/dicom-web/series';

	export let studyUid: string;

	export let seriesUid: string;

	export let images: ImagingInfo[];

	export let annotations: AnnotationInfo[] | undefined;

	onMount(async () => {
		const { extent, layer, view } = computePyramidInfo(studyUid, seriesUid, images);
		const features = await computeAnnotationFeatures(annotations);

		const map = new Map({
			controls: [],
			target: 'map',
			layers: [
				layer,
				new VectorLayer({
					source: new VectorSource({ features }),
					extent,
				}),
			],
			view,
		});

		map.getView().fit(extent, { size: map.getSize() });
	});
</script>

<div id="map" class="h-full w-full {$$props.class ?? ''}" />
