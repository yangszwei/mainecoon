<script lang="ts">
	/** The loading state of the component */
	export let loading = false;
</script>

<!--
	@component
	Card component with loading indicator.
-->
<div class="relative w-full overflow-hidden rounded-lg border shadow">
	<div role="none" class="group h-full cursor-pointer" on:click>
		<slot {loading} />
	</div>
	<div class="absolute inset-0 z-10 flex items-center justify-center bg-black/40" class:hidden={!loading}>
		<span class="loader" />
	</div>
</div>
