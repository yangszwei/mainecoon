<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const onEnter = (e: KeyboardEvent) => e.key === 'Enter' && dispatch('enter');

	export let label: string;

	export let required = false;

	export let value = '';
</script>

<!--
	@component
	Text input with a label, ignored when the value is empty and not required.
-->
<label class="flex items-center gap-3">
	<span class="select-none text-nowrap font-semibold text-white {$$props.class ?? ''}">{label}</span>
	<input form="" type="text" bind:value class="rounded-lg border-0 focus:ring-0" on:click on:keydown={onEnter} />
	{#if required || value}
		<input type="hidden" {required} {value} {...$$restProps} />
	{/if}
</label>
