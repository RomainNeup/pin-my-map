<script lang="ts">
	import type { PlaceEnrichment } from '$lib/api/place';
	import Globe from 'lucide-svelte/icons/globe';
	import Phone from 'lucide-svelte/icons/phone';
	import Star from 'lucide-svelte/icons/star';
	import Clock from 'lucide-svelte/icons/clock';

	type Props = { enrichment: PlaceEnrichment };
	let { enrichment }: Props = $props();

	let hoursOpen = $state(false);
	let allReviews = $state(false);

	const priceLabel = (level?: number): string => {
		if (level === undefined) return '';
		if (level === 0) return 'Free';
		return '€'.repeat(level);
	};
</script>

{#if enrichment.photos && enrichment.photos.length > 0}
	<div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
		<div class="flex gap-2">
			{#each enrichment.photos as photo}
				<img
					src={photo.url}
					alt={photo.attribution ?? ''}
					class="h-40 w-56 shrink-0 rounded-lg object-cover"
					loading="lazy"
				/>
			{/each}
		</div>
	</div>
{/if}

<div class="flex flex-wrap items-center gap-3 text-sm">
	{#if enrichment.externalRating !== undefined}
		<span class="inline-flex items-center gap-1 text-fg">
			<Star class="h-4 w-4 fill-yellow-400 stroke-yellow-500" />
			<span class="font-medium">{enrichment.externalRating.toFixed(1)}</span>
			{#if enrichment.externalRatingCount}
				<span class="text-fg-muted">({enrichment.externalRatingCount})</span>
			{/if}
		</span>
	{/if}
	{#if enrichment.priceLevel !== undefined}
		<span class="text-fg-muted">{priceLabel(enrichment.priceLevel)}</span>
	{/if}
	{#if enrichment.website}
		<a
			href={enrichment.website}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 text-accent hover:underline"
		>
			<Globe class="h-4 w-4" />
			Website
		</a>
	{/if}
	{#if enrichment.phoneNumber}
		<a
			href={`tel:${enrichment.phoneNumber}`}
			class="inline-flex items-center gap-1 text-accent hover:underline"
		>
			<Phone class="h-4 w-4" />
			{enrichment.phoneNumber}
		</a>
	{/if}
</div>

{#if enrichment.openingHours?.weekdayText && enrichment.openingHours.weekdayText.length > 0}
	<div class="rounded-lg border border-border bg-bg-elevated">
		<button
			class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-fg"
			onclick={() => (hoursOpen = !hoursOpen)}
			type="button"
		>
			<Clock class="h-4 w-4" />
			Opening hours
			<span class="ml-auto text-fg-muted">{hoursOpen ? '−' : '+'}</span>
		</button>
		{#if hoursOpen}
			<ul class="divide-y divide-border border-t border-border px-3 py-2 text-sm text-fg-muted">
				{#each enrichment.openingHours.weekdayText as line}
					<li class="py-1">{line}</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

{#if enrichment.reviews && enrichment.reviews.length > 0}
	<div class="space-y-2">
		<h2 class="text-sm font-semibold text-fg">Reviews</h2>
		<ul class="space-y-2">
			{#each allReviews ? enrichment.reviews : enrichment.reviews.slice(0, 3) as review}
				<li class="rounded-lg border border-border bg-bg-elevated p-3">
					<div class="flex items-center justify-between text-xs text-fg-muted">
						<span class="font-medium text-fg">{review.author}</span>
						<span class="inline-flex items-center gap-1">
							<Star class="h-3 w-3 fill-yellow-400 stroke-yellow-500" />
							{review.rating.toFixed(1)}
						</span>
					</div>
					{#if review.text}
						<p class="mt-1 text-sm text-fg-muted">{review.text}</p>
					{/if}
				</li>
			{/each}
		</ul>
		{#if enrichment.reviews.length > 3}
			<button
				class="text-xs text-accent hover:underline"
				type="button"
				onclick={() => (allReviews = !allReviews)}
			>
				{allReviews ? 'Show less' : `Show all ${enrichment.reviews.length} reviews`}
			</button>
		{/if}
	</div>
{/if}
