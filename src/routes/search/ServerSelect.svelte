<script lang="ts">
	interface ServerOption {
		name: string;
		url: string;
	}

	export let servers: ServerOption[];

	export let value: string;
</script>

{#if servers && servers.length > 1}
	<select bind:value class="rounded-lg {$$props.class}" on:change>
		{#each servers as { name }}
			<option selected={name === value} value={name}>{name}</option>
		{/each}
	</select>
{/if}
