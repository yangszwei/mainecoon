<script lang="ts">
	import '@fontsource/noto-sans-tc/400.css';
	import '@fontsource/noto-sans-tc/500.css';
	import '../app.css';
</script>

<slot />

<style lang="postcss">
	:global(html) {
		@apply h-full;
	}

	:global(body) {
		@apply h-full;
	}
</style>
