<script lang="ts">
	import Map from '$lib/components/Map.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import CommentSection from '$lib/components/public/CommentSection.svelte';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sp = $derived(data.savedPlace);
	const lat = $derived(sp.place.location.lat);
	const lng = $derived(sp.place.location.lng);
</script>

<div class="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
	<a
		href={`/u/${data.slug}`}
		class="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
	>
		<ChevronLeft class="h-4 w-4" /> Back to {data.ownerName}'s map
	</a>

	<header>
		<h1 class="text-2xl font-semibold text-fg">{sp.place.name}</h1>
		{#if sp.place.address}
			<div class="flex items-start gap-1 text-sm text-fg-muted">
				<MapPin class="mt-0.5 h-4 w-4 shrink-0" />
				<span>{sp.place.address}</span>
			</div>
		{/if}
	</header>

	<div class="h-72 overflow-hidden rounded-xl">
		<Map
			sources={[
				{
					key: 'p',
					points: [{ id: sp.id, position: [lng, lat], name: sp.place.name }]
				}
			]}
			{lat}
			{lng}
			zoom={14}
		/>
	</div>

	{#if sp.rating !== undefined}
		<StarRating rating={sp.rating} disabled size="1.25rem" />
	{/if}

	{#if sp.comment}
		<section class="space-y-2 rounded-xl border border-border bg-bg-elevated p-4">
			<h2 class="font-semibold text-fg">Notes from {data.ownerName}</h2>
			<p class="whitespace-pre-wrap text-sm text-fg">{sp.comment}</p>
		</section>
	{/if}

	{#if sp.tags.length > 0}
		<div class="flex flex-wrap gap-1">
			{#each sp.tags as tag}
				<span class="rounded bg-bg-muted px-2 py-0.5 text-xs text-fg-muted">
					{tag.emoji ?? ''}
					{tag.name}
				</span>
			{/each}
		</div>
	{/if}

	<CommentSection savedPlaceId={sp.id} ownerUserId={data.ownerUserId} />
</div>
