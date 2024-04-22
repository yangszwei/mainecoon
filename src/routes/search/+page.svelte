<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import SearchFilter from './SearchFilter.svelte';
	import StudyList from './StudyList.svelte';
	import StudyViewer from './StudyViewer.svelte';

	import type { PageData, Snapshot } from './$types';
	import type { DicomStudy } from '$lib/dicom-web/studies';

	export let data: PageData;

	let activeStudy: DicomStudy;
	let studyList: any; // eslint-disable-line @typescript-eslint/no-explicit-any

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify(activeStudy),
		restore: (value) => {
			activeStudy = JSON.parse(value as string);
			studyList.scrollTo(activeStudy.studyUid);
		},
	};
</script>

<div class="flex h-full w-full flex-col">
	<Header>
		<SearchFilter filter={data.filter} />
	</Header>

	<main class="flex overflow-hidden">
		<StudyList bind:this={studyList} studies={data.studies} bind:value={activeStudy} />
		<StudyViewer data={activeStudy} />
	</main>
</div>
