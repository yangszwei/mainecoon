<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { assets, base } from '$app/paths';

	let historyNavigation = false;

	const gotoHome = (e: MouseEvent) => {
		e.preventDefault();
		historyNavigation ? history.back() : goto(`${base}/`);
		historyNavigation = false;
	};

	afterNavigate((navigation) => {
		if (navigation.from?.route.id === '/search') {
			historyNavigation = true;
		}
	});
</script>

<!--
	@component
	Base header for the application.
-->
<header class="z-50 flex h-20 shrink-0 items-center gap-3 bg-green-500 px-3 shadow">
	<!-- App Title -->
	<a href="{base}/" target="_self" class="flex items-center gap-2 text-2xl text-white" on:click={gotoHome}>
		<img src="{assets}/favicon.png" class="h-16 w-16 object-contain" alt="" />
		<span class="font-serif font-bold uppercase tracking-wide">MaineCoon</span>
	</a>

	<!-- Custom Actions -->
	<div class="grow {$$props.class ?? ''}">
		<slot />
	</div>
</header>
