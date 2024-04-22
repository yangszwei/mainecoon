<script lang="ts">
	import type { DicomStudy } from '$lib/dicom-web/studies';

	let wrapper: HTMLDivElement;

	export const scrollTo = (studyUid: string) => {
		const item = wrapper.querySelector(`[data-study-uid="${studyUid}"]`) as HTMLLIElement;
		if (item) wrapper.scrollTo({ top: item.offsetTop - wrapper.offsetTop, behavior: 'smooth' });
	};

	export let studies: DicomStudy[] = [];

	export let value: DicomStudy | null = null;

	$: if (!value) value = studies?.[0];
</script>

<!--
	@component
	A list of studies to select from.
-->
<div bind:this={wrapper} class="h-full shrink-0 overflow-auto border-r">
	{#if studies && studies.length > 0}
		<ul class="w-96 {$$props.class ?? ''}">
			{#each studies as study (study.studyUid)}
				<li
					class="overflow-hidden border hover:bg-zinc-100"
					class:active={study.studyUid === value?.studyUid}
					data-study-uid={study.studyUid}
				>
					<div
						role="none"
						class="flex w-full flex-col items-start break-all p-3 text-left"
						on:click={() => (value = study)}
					>
						<p class="text-xl font-medium">{study.patientId} / {study.patientName}</p>
						<p class="text-zinc-600">{study.patientBirthDate} / {study.patientSex}</p>
						<p class="text-zinc-600">{study.accessionNumber} / {study.studyDate}</p>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="flex h-full w-96 items-center justify-center">
			<p class="select-none text-zinc-500">No studies found</p>
		</div>
	{/if}
</div>

<style lang="postcss">
	.active {
		@apply bg-zinc-200 hover:bg-zinc-200;
	}
</style>
