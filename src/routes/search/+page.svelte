<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import SearchFilter from './SearchFilter.svelte';
	import StudyList from './StudyList.svelte';
	import StudyViewer from './StudyViewer.svelte';

	import type { DicomStudy } from '$lib/dicom-web/studies';
	import type { PageData } from './$types';

	export let data: PageData;

	let activeStudy: DicomStudy;
</script>

<div class="flex h-full w-full flex-col">
	<Header>
		<SearchFilter filter={data.filter} />
	</Header>

	<main class="flex overflow-hidden">
		<StudyList studies={data.studies} bind:value={activeStudy} />
		<StudyViewer data={activeStudy} />
	</main>
</div>
