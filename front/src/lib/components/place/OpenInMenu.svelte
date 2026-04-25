<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { buildDeeplink, type DeeplinkApp, type DeeplinkTarget } from '$lib/utils/mapDeeplinks';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import Navigation from 'lucide-svelte/icons/navigation';

	type Props = {
		target: DeeplinkTarget;
		fullwidth?: boolean;
	};

	let { target, fullwidth = false }: Props = $props();

	let open = $state(false);
	let anchor = $state<HTMLElement | null>(null);

	const apps: { id: DeeplinkApp; label: string }[] = [
		{ id: 'google', label: 'Google Maps' },
		{ id: 'apple', label: 'Apple Maps' },
		{ id: 'citymapper', label: 'Citymapper' },
		{ id: 'waze', label: 'Waze' }
	];
</script>

{#snippet openInPrefix()}<Navigation class="h-4 w-4" />{/snippet}

<div bind:this={anchor} class={fullwidth ? 'w-full' : ''}>
	<Button
		variant="outline"
		tone="neutral"
		{fullwidth}
		prefix={openInPrefix}
		onclick={() => (open = !open)}
	>
		Open in...
	</Button>
</div>

<Popover bind:open {anchor} placement="bottom-start">
	<div class="flex flex-col">
		{#each apps as app}
			<a
				href={buildDeeplink(app.id, target)}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-fg hover:bg-bg-muted"
				role="menuitem"
				onclick={() => (open = false)}
			>
				<span>{app.label}</span>
				<ExternalLink class="h-3.5 w-3.5 text-fg-muted" />
			</a>
		{/each}
	</div>
</Popover>
