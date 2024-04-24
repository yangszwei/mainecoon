<script lang="ts">
	import { DICOMWEB_SERVER } from '$lib/dicom-web/server';
	import { DICOMWEB_URLS } from '$lib/dicom-web';
	import Header from '$lib/components/Header.svelte';
	import SearchFilter from './SearchFilter.svelte';
	import ServerSelect from './ServerSelect.svelte';
	import StudyList from './StudyList.svelte';
	import StudyViewer from './StudyViewer.svelte';

	import type { PageData, Snapshot } from './$types';
	import type { DicomStudy } from '$lib/dicom-web/studies';

	export let data: PageData;

	let activeStudy: DicomStudy;
	let studyList: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	let search: () => void;

	export const snapshot: Snapshot<string> = {
		capture: () => JSON.stringify(activeStudy),
		restore: (value) => {
			$DICOMWEB_SERVER = data.filter.server;
			activeStudy = JSON.parse(value as string);
			studyList.scrollTo(activeStudy.studyUid);
		},
	};

	$: if (!$DICOMWEB_SERVER) $DICOMWEB_SERVER = DICOMWEB_URLS[0].name;
</script>

<div class="flex h-full w-full flex-col">
	<Header class="flex items-center">
		<SearchFilter bind:search filter={data.filter} />
		<ServerSelect bind:value={$DICOMWEB_SERVER} servers={DICOMWEB_URLS} class="ml-auto mr-0" on:change={search} />
	</Header>

	<main class="flex h-full overflow-hidden">
		<StudyList bind:this={studyList} studies={data.studies} bind:value={activeStudy} />
		<StudyViewer data={activeStudy} />
	</main>
</div>
