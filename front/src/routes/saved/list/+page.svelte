<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Map from '$lib/components/Map.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SkeletonCard from '$lib/components/ui/SkeletonCard.svelte';
	import Check from 'lucide-svelte/icons/check';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

{#snippet searchPrefix()}<Search class="h-4 w-4" />{/snippet}
{#snippet mapPinIcon()}<MapPinIcon class="h-6 w-6" />{/snippet}
{#snippet doneChipPrefix()}<Check class="h-3 w-3" />{/snippet}

{#snippet searchAction()}
	<Button variant="solid" tone="accent" href="/place/search" prefix={searchPrefix}>
		Search places
	</Button>
{/snippet}

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<div class="mb-6 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">Saved places</h1>
		<Button variant="soft" tone="accent" href="/place/search" prefix={searchPrefix}>
			Find new places
		</Button>
	</div>

	{#if data.savedPlaces === undefined}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _u, i (i)}
				<SkeletonCard />
			{/each}
		</div>
	{:else if data.savedPlaces.length === 0}
		<EmptyState
			title="No saved places yet"
			description="Search for places to add to your collection."
			icon={mapPinIcon}
			action={searchAction}
		/>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.savedPlaces as savedPlace (savedPlace.id)}
				<a
					href={`/saved/${savedPlace.id}`}
					class="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm transition-shadow hover:shadow-md sm:flex-row"
				>
					<div class="h-32 w-full shrink-0 sm:h-24 sm:w-24">
						<Map
							sources={[
								{
									key: savedPlace.place.name,
									points: [
										{
											id: savedPlace.place.id,
											position: [savedPlace.place.location.lng, savedPlace.place.location.lat]
										}
									]
								}
							]}
							lat={savedPlace.place.location.lat}
							lng={savedPlace.place.location.lng}
							zoom={14}
							controls={false}
						/>
					</div>
					<div class="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
						<div class="flex items-start justify-between gap-2">
							<h3 class="truncate font-semibold text-fg">{savedPlace.place.name}</h3>
							{#if savedPlace.done}
								<Chip size="sm" prefix={doneChipPrefix}>Done</Chip>
							{/if}
						</div>
						{#if savedPlace.place.description}
							<p class="line-clamp-2 text-sm text-fg-muted">
								{savedPlace.place.description}
							</p>
						{/if}
						{#if savedPlace.tags && savedPlace.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each savedPlace.tags.slice(0, 3) as tag (tag.id)}
									<Chip size="sm" prefix={tag.emoji}>{tag.name}</Chip>
								{/each}
								{#if savedPlace.tags.length > 3}
									<Chip size="sm">+{savedPlace.tags.length - 3} more</Chip>
								{/if}
							</div>
						{/if}
						{#if savedPlace.rating && savedPlace.rating > 0}
							<div class="pt-0.5">
								<StarRating rating={savedPlace.rating} disabled size="0.9rem" />
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
