<script lang="ts">
	import Collapse from '$lib/components/Collapse.svelte';
	import TextInput from '$lib/components/TextInput.svelte';

	export let filter: Record<string, string>;

	let form: HTMLFormElement;
	let expand: (expand: boolean) => void;

	const search = () => {
		form.requestSubmit();
		expand(false);
	};
</script>

<!--
	@component
	Search form for filtering studies by patient ID, patient name, study UID, accession number, and study date.
-->
<form bind:this={form} method="get" class="ml-32" on:submit={() => expand(false)}>
	<Collapse class="flex items-center gap-6 px-3 py-2" bind:expand>
		<TextInput
			label="Patient ID"
			name="patientId"
			value={filter.patientId}
			on:click={() => expand(true)}
			on:enter={search}
		/>
		<button type="submit" tabindex="-1" class="btn-outline h-10" on:click={() => expand(false)}>Search</button>

		<div slot="menu" class="-mt-2 space-y-3 rounded-xl bg-green-500 p-3">
			<TextInput label="Patient Name" name="patientName" value={filter.patientName} on:enter={search} />
			<TextInput label="Study UID" name="studyUid" value={filter.studyUid} on:enter={search} />
			<TextInput label="Accession Number" name="accessionNumber" value={filter.accessionNumber} on:enter={search} />
			<TextInput label="Study Date" name="studyDate" value={filter.studyDate} on:enter={search} />
		</div>
	</Collapse>
</form>
