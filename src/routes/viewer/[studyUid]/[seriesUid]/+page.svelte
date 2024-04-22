<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import MicroscopyViewer from './MicroscopyViewer.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="flex h-full w-full flex-col">
	<Header />
	<MicroscopyViewer
		studyUid={data.studyUid}
		seriesUid={data.seriesUid}
		images={data.images}
		annotations={data.annotations}
		class="grow"
	/>
</div>
