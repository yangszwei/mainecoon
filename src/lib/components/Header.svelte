<script lang="ts">
	import { assets, base } from '$app/paths';
</script>

<!--
	@component
	Base header for the application.
-->
<header class="flex h-20 shrink-0 items-center gap-3 bg-green-500 px-3 shadow">
	<!-- App Title -->
	<a href="{base}/" target="_self" class="flex items-center gap-2 text-2xl text-white">
		<img src="{assets}/favicon.png" class="h-16 w-16 object-contain" alt="" />
		<span class="font-serif font-bold uppercase tracking-wide">MaineCoon</span>
	</a>

	<!-- Custom Actions -->
	<div class="grow {$$props.class ?? ''}">
		<slot />
	</div>
</header>
