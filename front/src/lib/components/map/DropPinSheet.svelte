<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { reverseGeocode } from '$lib/api/mapbox';
	import Button from '$lib/components/Button.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';

	interface Props {
		lat: number;
		lng: number;
		onCancel?: () => void;
	}

	const { lat, lng, onCancel }: Props = $props();

	let address = $state<string | null>(null);
	let loading = $state(true);

	onMount(async () => {
		try {
			const result = await reverseGeocode(lng, lat);
			address = result.address;
		} catch {
			address = null;
		} finally {
			loading = false;
		}
	});

	const createHere = () => {
		const params = new URLSearchParams({
			lat: lat.toFixed(6),
			lng: lng.toFixed(6)
		});
		if (address) params.set('address', address);
		goto(`/place/create?${params.toString()}`);
	};
</script>

<div class="space-y-4">
	<div class="flex items-start gap-3">
		<span
			class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
		>
			<MapPin class="h-5 w-5" />
		</span>
		<div class="min-w-0 flex-1">
			<h2 class="text-lg font-semibold">Drop a pin here?</h2>
			{#if loading}
				<div class="mt-1 space-y-1">
					<Skeleton h="h-3.5" w="w-3/4" />
					<Skeleton h="h-3.5" w="w-1/2" />
				</div>
			{:else if address}
				<p class="mt-1 text-sm text-fg-muted">{address}</p>
			{:else}
				<p class="mt-1 text-sm text-fg-subtle">Unknown address</p>
			{/if}
			<p class="mt-1 font-mono text-xs text-fg-subtle">
				{lat.toFixed(5)}, {lng.toFixed(5)}
			</p>
		</div>
	</div>

	<div class="flex gap-2 pt-2">
		<Button fullwidth onclick={createHere}>Create place here</Button>
		<Button variant="ghost" tone="neutral" onclick={onCancel}>Cancel</Button>
	</div>
</div>
