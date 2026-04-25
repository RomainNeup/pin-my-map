<script lang="ts">
	import type { Place, PlaceEnrichment } from '$lib/api/place';
	import PlacePhotoCarousel from './PlacePhotoCarousel.svelte';
	import OpenInMenu from './OpenInMenu.svelte';
	import Clock from 'lucide-svelte/icons/clock';
	import Globe from 'lucide-svelte/icons/globe';
	import Phone from 'lucide-svelte/icons/phone';
	import Star from 'lucide-svelte/icons/star';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import AlertTriangle from 'lucide-svelte/icons/triangle-alert';
	import ExternalLink from 'lucide-svelte/icons/external-link';
	import CalendarClock from 'lucide-svelte/icons/calendar-clock';

	type Props = {
		place: Place;
		enrichment: PlaceEnrichment;
		isAdmin?: boolean;
		onToggleClosed?: (closed: boolean) => void;
	};
	let { place, enrichment, isAdmin = false, onToggleClosed }: Props = $props();

	let hoursOpen = $state(false);
	let allReviews = $state(false);

	const priceLabel = (level?: number): string => {
		if (level === undefined || level === null) return '';
		if (level === 0) return 'Free';
		return '$'.repeat(level);
	};

	const deeplinkTarget = $derived({
		name: place.name,
		lat: place.location.lat,
		lng: place.location.lng,
		placeId: place.externalId
	});

	// ── Amenity chips ─────────────────────────────────────────────────────────

	type AmenityChip = { label: string; icon: string; value?: string };

	const amenityChips = $derived((): AmenityChip[] => {
		const a = enrichment.amenities;
		if (!a) return [];
		const chips: AmenityChip[] = [];
		if (a.wheelchair === 'yes') chips.push({ icon: '♿', label: 'Wheelchair accessible' });
		else if (a.wheelchair === 'limited')
			chips.push({ icon: '♿', label: 'Limited wheelchair access' });
		if (a.outdoorSeating) chips.push({ icon: '🪑', label: 'Outdoor seating' });
		if (a.wifi === 'yes' || a.wifi === 'wlan') chips.push({ icon: '📶', label: 'Wi-Fi' });
		if (a.dietVegetarian === 'yes') chips.push({ icon: '🥗', label: 'Vegetarian options' });
		else if (a.dietVegetarian === 'only') chips.push({ icon: '🥗', label: 'Vegetarian only' });
		if (a.dietVegan === 'yes') chips.push({ icon: '🌱', label: 'Vegan options' });
		else if (a.dietVegan === 'only') chips.push({ icon: '🌱', label: 'Vegan only' });
		if (a.dietGlutenFree === 'yes') chips.push({ icon: '🌾', label: 'Gluten-free options' });
		return chips;
	});
</script>

{#if place.permanentlyClosed}
	<div
		class="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400"
	>
		<AlertTriangle class="h-4 w-4 shrink-0" />
		<span>This place is permanently closed.</span>
	</div>
{/if}

{#if enrichment.photos && enrichment.photos.length > 0}
	<PlacePhotoCarousel photos={enrichment.photos} />
{/if}

<div class="flex flex-wrap items-center gap-3 text-sm">
	{#if enrichment.externalRating !== undefined}
		<span class="inline-flex items-center gap-1 text-fg">
			<Star class="h-4 w-4 fill-yellow-400 stroke-yellow-500" />
			<span class="font-medium">{enrichment.externalRating.toFixed(1)}</span>
			{#if enrichment.externalRatingCount}
				<span class="text-fg-muted">({enrichment.externalRatingCount.toLocaleString()})</span>
			{/if}
		</span>
	{/if}
	{#if enrichment.priceLevel !== undefined && enrichment.priceLevel !== null}
		<span class="font-medium text-fg-muted">{priceLabel(enrichment.priceLevel)}</span>
	{/if}
	{#if place.saveCount !== undefined && place.saveCount > 0}
		<span class="inline-flex items-center gap-1 text-fg-muted">
			<Bookmark class="h-4 w-4" />
			Saved by {place.saveCount} {place.saveCount === 1 ? 'user' : 'users'}
		</span>
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
	{#if enrichment.googleMapsUri}
		<a
			href={enrichment.googleMapsUri}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-1 text-accent hover:underline"
		>
			<MapPin class="h-4 w-4" />
			Google Maps
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
				{#each enrichment.openingHours.weekdayText as line, i (i)}
					<li class="py-1">{line}</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

{#if enrichment.socialLinks && Object.keys(enrichment.socialLinks).some((k) => enrichment.socialLinks![k as keyof typeof enrichment.socialLinks])}
	<div class="flex flex-wrap items-center gap-3">
		{#if enrichment.socialLinks.instagram}
			<a
				href={enrichment.socialLinks.instagram}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
				aria-label="Instagram"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
					/>
				</svg>
				Instagram
			</a>
		{/if}
		{#if enrichment.socialLinks.facebook}
			<a
				href={enrichment.socialLinks.facebook}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
				aria-label="Facebook"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
					/>
				</svg>
				Facebook
			</a>
		{/if}
		{#if enrichment.socialLinks.twitter}
			<a
				href={enrichment.socialLinks.twitter}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
				aria-label="Twitter / X"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
					/>
				</svg>
				Twitter
			</a>
		{/if}
		{#if enrichment.socialLinks.tiktok}
			<a
				href={enrichment.socialLinks.tiktok}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
				aria-label="TikTok"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"
					/>
				</svg>
				TikTok
			</a>
		{/if}
	</div>
{/if}

{#if amenityChips().length > 0}
	<div class="flex flex-wrap gap-2">
		{#each amenityChips() as chip (chip.label)}
			<span
				class="inline-flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-xs text-fg-muted"
			>
				<span aria-hidden="true">{chip.icon}</span>
				{chip.label}
			</span>
		{/each}
	</div>
{/if}

{#if enrichment.reservationLinks && enrichment.reservationLinks.length > 0}
	<div class="flex flex-wrap gap-2">
		{#each enrichment.reservationLinks as link, i (i)}
			<a
				href={link}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
			>
				<CalendarClock class="h-4 w-4" />
				Reserve a table
			</a>
		{/each}
	</div>
{/if}

<div>
	<OpenInMenu target={deeplinkTarget} />
</div>

{#if enrichment.reviews && enrichment.reviews.length > 0}
	<div class="space-y-2">
		<h2 class="text-sm font-semibold text-fg">Reviews</h2>
		<ul class="space-y-2">
			{#each allReviews ? enrichment.reviews : enrichment.reviews.slice(0, 3) as review (review.author + review.time)}
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

{#if isAdmin}
	<div class="border-t border-border pt-3">
		<button
			type="button"
			class={[
				'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
				place.permanentlyClosed
					? 'border-green-500/40 text-green-600 hover:bg-green-500/10 dark:text-green-400'
					: 'border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400'
			].join(' ')}
			onclick={() => onToggleClosed?.(!place.permanentlyClosed)}
		>
			<ExternalLink class="mr-1 inline h-3.5 w-3.5" />
			{place.permanentlyClosed ? 'Reopen place' : 'Mark as permanently closed'}
		</button>
	</div>
{/if}
