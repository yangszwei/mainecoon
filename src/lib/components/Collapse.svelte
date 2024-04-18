<script lang="ts">
	import { browser } from '$app/environment';

	let menu: HTMLDivElement;

	/** Set the expand state of the menu */
	export const expand = (expand: boolean) => {
		if (!browser || !menu) return;
		if (expand) {
			menu.classList.remove('hidden');
			setTimeout(() => {
				menu.classList.add('opacity-100');
				menu.classList.remove('opacity-0');
			}, 10);
		} else {
			menu.classList.add('opacity-0');
			menu.classList.remove('opacity-100');
			setTimeout(() => menu.classList.add('hidden'), 150);
		}
	};
</script>

<div role="none" class="relative w-fit border-b" on:mouseleave={() => expand(false)}>
	<div role="none" class="z-10 {$$props.class ?? ''}" on:mouseenter={() => expand(true)}>
		<slot {expand} />
	</div>
	<div bind:this={menu} class="absolute -inset-x-[1px] top-full opacity-0 transition-opacity">
		<slot name="menu" {expand} />
	</div>
</div>
