<script lang="ts">
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import type { SavedPlace } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import StarRating from '$lib/components/StarRating.svelte';

	interface Props {
		savedPlace: SavedPlace;
	}

	const { savedPlace }: Props = $props();
</script>

<div class="space-y-4">
	<header class="space-y-1">
		<h2 class="text-xl font-semibold">{savedPlace.place.name}</h2>
		{#if savedPlace.place.address}
			<p class="flex items-start gap-1.5 text-sm text-fg-muted">
				<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
				<span>{savedPlace.place.address}</span>
			</p>
		{/if}
	</header>

	{#if savedPlace.place.description}
		<p class="text-sm text-fg-muted">{savedPlace.place.description}</p>
	{/if}

	{#if savedPlace.rating != null && savedPlace.rating > 0}
		<div class="flex items-center gap-2">
			<StarRating rating={savedPlace.rating} disabled size="1rem" />
			<span class="text-xs text-fg-muted">{savedPlace.rating.toFixed(1)}</span>
		</div>
	{/if}

	{#if savedPlace.tags?.length}
		<div class="flex flex-wrap gap-1.5">
			{#each savedPlace.tags as tag (tag.id)}
				<Chip size="sm">
					{#snippet prefix()}<span>{tag.emoji}</span>{/snippet}
					{tag.name}
				</Chip>
			{/each}
		</div>
	{/if}

	{#if savedPlace.comment}
		<blockquote class="border-l-2 border-accent pl-3 text-sm italic text-fg-muted">
			{savedPlace.comment}
		</blockquote>
	{/if}

	<div class="flex gap-2 pt-2">
		<Button href={`/saved/${savedPlace.id}`} fullwidth>Open details</Button>
		<Button
			href={`https://www.google.com/maps/dir/?api=1&destination=${savedPlace.place.location.lat},${savedPlace.place.location.lng}`}
			variant="outline"
			tone="neutral"
		>
			{#snippet prefix()}<ExternalLink class="h-4 w-4" />{/snippet}
			Directions
		</Button>
	</div>
</div>
