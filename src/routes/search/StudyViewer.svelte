<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Icon from '@iconify/svelte';
	import { getStudyInfo } from '$lib/dicom-web/studies';
	import { goto } from '$app/navigation';
	import mdiImageMultiple from '@iconify-icons/mdi/image-multiple';
	import mdiTag from '@iconify-icons/mdi/tag';

	import type { DicomStudy, StudyInfo } from '$lib/dicom-web/studies';

	export let data: DicomStudy;

	const loadingStates: Record<string, boolean> = {};

	const openSeries = async (series: StudyInfo | undefined) => {
		if (series) {
			loadingStates[series.seriesUid] = true;
			await goto(`/viewer/${series.studyUid}/${series.seriesUid}`);
			loadingStates[series.seriesUid] = false;
		}
	};
</script>

<!--
	@component
	The component shows the viewer links to navigate to the study's imaging and annotations.
-->
<div class="h-full w-full overflow-auto">
	<h1 class="page-title m-6"><Icon icon={mdiImageMultiple} class="h-8 w-8" /> Images</h1>
	{#if data}
		{#await getStudyInfo(data.studyUid)}
			<div>
				<p class="text-center">Loading...</p>
			</div>
		{:then study}
			<div class="m-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
				<!-- SM -->
				{#if study.sm}
					<Card loading={loadingStates[study.sm.seriesUid]} on:click={() => openSeries(study.sm)}>
						<header class="h-36 shrink-0">
							<img src={study.sm.thumbnail} class="h-full w-full object-cover" alt="" />
						</header>
						<main class="h-full border-t bg-gray-50 p-3 transition-colors group-hover:bg-gray-100">
							<h1 class="mb-1 text-lg font-bold text-green-500">{study.sm.modality}</h1>
							<p class="text-sm text-gray-600">最大圖片數量：{study.sm.numberOfFrames}</p>
							<p class="text-sm text-gray-600">擁有放大倍率：{study.sm.instances} 層</p>
						</main>
					</Card>
				{/if}

				<!-- Annotations -->
				{#each study.annotations as annotation}
					{#if annotation}
						<Card loading={loadingStates[annotation.seriesUid]} on:click={() => openSeries(annotation)}>
							<header class="h-36 shrink-0">
								<Icon icon={mdiTag} class="mx-auto h-32 w-32 text-red-500/90" />
							</header>
							<main class="h-full border-t bg-gray-50 p-3 transition-colors group-hover:bg-gray-100">
								<h1 class="mb-1 text-lg font-bold text-green-500">{annotation?.modality}</h1>
								<p class="text-sm text-gray-600">{annotation?.graphicType?.sort().join(', ')}</p>
							</main>
						</Card>
					{/if}
				{/each}
			</div>
		{:catch error}
			<p class="m-6">{error.message}</p>
		{/await}
	{/if}
</div>
