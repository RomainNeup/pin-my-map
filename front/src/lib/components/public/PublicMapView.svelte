<script lang="ts">
	import type { PublicMap, PublicSavedPlace } from '$lib/api/publicMap';
	import Map from '$lib/components/Map.svelte';
	import StaticMapThumb from '$lib/components/StaticMapThumb.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import FollowButton from '$lib/components/public/FollowButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';

	type Props = {
		map: PublicMap;
		basePath: string;
		/** Called when user requests the next page. Returns new saved places to append. */
		onLoadMore?: () => Promise<PublicSavedPlace[]>;
		/** Whether there are more pages to load. */
		hasMore?: boolean;
		/** Total count from the backend (if available). */
		total?: number;
	};

	let { map, basePath, onLoadMore, hasMore = false, total }: Props = $props();

	let loadedPlaces = $state<PublicSavedPlace[]>([...map.savedPlaces]);
	let loadingMore = $state(false);

	// Keep loadedPlaces in sync when initial map data changes (e.g. tab switch resets)
	$effect(() => {
		loadedPlaces = [...map.savedPlaces];
	});

	const points = $derived(
		loadedPlaces
			.filter((sp) => sp.place?.location)
			.map((sp) => ({
				id: sp.id,
				position: [sp.place.location.lng, sp.place.location.lat] as [number, number],
				name: sp.place.name,
				rating: sp.rating
			}))
	);

	const center = $derived(
		points.length > 0
			? { lat: points[0].position[1], lng: points[0].position[0] }
			: { lat: 0, lng: 0 }
	);

	const displayTotal = $derived(total ?? map.total ?? loadedPlaces.length);

	async function loadMore() {
		if (!onLoadMore || loadingMore) return;
		loadingMore = true;
		try {
			const next = await onLoadMore();
			loadedPlaces = [...loadedPlaces, ...next];
		} finally {
			loadingMore = false;
		}
	}
</script>

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<header class="mb-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold text-fg">{map.owner.name}'s map</h1>
			<p class="text-sm text-fg-muted">
				{#if displayTotal !== loadedPlaces.length}
					Showing {loadedPlaces.length} of {displayTotal} saved place{displayTotal === 1 ? '' : 's'}
				{:else}
					{displayTotal} saved place{displayTotal === 1 ? '' : 's'}
				{/if}
			</p>
		</div>
		{#if map.owner.userId}
			<FollowButton userId={map.owner.userId} />
		{/if}
	</header>

	<div class="mb-6 h-72 overflow-hidden rounded-xl md:h-96">
		<Map sources={[{ key: 'public', points }]} lat={center.lat} lng={center.lng} zoom={11} />
	</div>

	{#if loadedPlaces.length === 0}
		<p class="py-8 text-center text-fg-muted">No saved places yet.</p>
	{:else}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each loadedPlaces as sp (sp.id)}
				<li
					class="overflow-hidden rounded-xl border border-border bg-bg-elevated transition hover:border-accent"
				>
					<a href={`${basePath}/place/${sp.id}`} class="block">
						<div class="h-32 w-full">
							<StaticMapThumb lat={sp.place.location.lat} lng={sp.place.location.lng} zoom={13} />
						</div>
						<div class="space-y-1 p-3">
							<h3 class="font-semibold text-fg">{sp.place.name}</h3>
							{#if sp.place.address}
								<div class="flex items-start gap-1 text-xs text-fg-muted">
									<MapPinIcon class="mt-0.5 h-3 w-3 shrink-0" />
									<span class="line-clamp-1">{sp.place.address}</span>
								</div>
							{/if}
							{#if sp.rating !== undefined}
								<StarRating rating={sp.rating} disabled size="1rem" />
							{/if}
							{#if sp.tags.length > 0}
								<div class="flex flex-wrap gap-1 pt-1">
									{#each sp.tags as tag}
										<span class="rounded bg-bg-muted px-2 py-0.5 text-xs text-fg-muted">
											{tag.emoji ?? ''}
											{tag.name}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>

		{#if loadingMore}
			<div class="mt-6 flex justify-center">
				<Loader size="md" />
			</div>
		{:else if hasMore && onLoadMore}
			<div class="mt-6 flex justify-center">
				<Button variant="outline" tone="neutral" onclick={loadMore}>Load more</Button>
			</div>
		{/if}
	{/if}
</div>
