<script lang="ts">
	import MicroscopyViewer from './MicroscopyViewer.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="h-full w-full">
	<MicroscopyViewer studyUid={data.studyUid} seriesUid={data.seriesUid} images={data.images} />
</div>
