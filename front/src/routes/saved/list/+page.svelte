<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { getSavedPlaces, type SavedPlace } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import StaticMapThumb from '$lib/components/StaticMapThumb.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import TagFilterChips from '$lib/components/map/TagFilterChips.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SkeletonCard from '$lib/components/ui/SkeletonCard.svelte';
	import { tags } from '$lib/stores/tags';
	import Check from 'lucide-svelte/icons/check';
	import Download from 'lucide-svelte/icons/download';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';

	const PAGE_SIZE = 20;

	let items = $state<SavedPlace[]>([]);
	let selectedTagIds = $state<string[]>([]);
	let loading = $state(false);
	let initialLoaded = $state(false);
	let done = $state(false);
	let sentinel = $state<HTMLDivElement | null>(null);

	let requestId = 0;

	async function fetchPage(reset: boolean) {
		if (loading) return;
		if (!reset && done) return;
		loading = true;
		const id = ++requestId;
		const offset = reset ? 0 : items.length;
		try {
			const res = await getSavedPlaces({
				limit: PAGE_SIZE,
				offset,
				tagIds: selectedTagIds
			});
			if (id !== requestId) return;
			const next = (res ?? []) as SavedPlace[];
			items = reset ? next : [...items, ...next];
			done = next.length < PAGE_SIZE;
		} finally {
			if (id === requestId) {
				loading = false;
				initialLoaded = true;
			}
		}
	}

	let filterKey = $derived([...selectedTagIds].sort().join(','));
	$effect(() => {
		const _key = filterKey;
		void _key;
		untrack(() => fetchPage(true));
	});

	$effect(() => {
		if (!sentinel) return;
		const node = sentinel;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) fetchPage(false);
			},
			{ rootMargin: '400px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	});

	function onTagsChange(next: string[]) {
		selectedTagIds = next;
	}
</script>

{#snippet searchPrefix()}<Search class="h-4 w-4" />{/snippet}
{#snippet importPrefix()}<Download class="h-4 w-4" />{/snippet}
{#snippet mapPinIcon()}<MapPinIcon class="h-6 w-6" />{/snippet}
{#snippet doneChipPrefix()}<Check class="h-3 w-3" />{/snippet}

{#snippet searchAction()}
	<Button variant="solid" tone="accent" href="/place/search" prefix={searchPrefix}>
		Search places
	</Button>
{/snippet}

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<div class="mb-4 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">Saved places</h1>
		<div class="flex gap-2">
			<Button variant="ghost" tone="neutral" href="/import" prefix={importPrefix}>Import</Button>
			<Button variant="soft" tone="accent" href="/place/search" prefix={searchPrefix}>
				Find new places
			</Button>
		</div>
	</div>

	{#if $tags?.length}
		<div class="mb-5">
			<TagFilterChips tags={$tags} bind:selected={selectedTagIds} onChange={onTagsChange} />
		</div>
	{/if}

	{#if !initialLoaded}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _u, i (i)}
				<SkeletonCard />
			{/each}
		</div>
	{:else if items.length === 0}
		{#if selectedTagIds.length > 0}
			<EmptyState
				title="No matches for these tags"
				description="Try removing a tag or clearing the filter."
				icon={mapPinIcon}
			/>
		{:else}
			<EmptyState
				title="No saved places yet"
				description="Search for places to add to your collection."
				icon={mapPinIcon}
				action={searchAction}
			/>
		{/if}
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each items as savedPlace (savedPlace.id)}
				<div
					class="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm transition-shadow hover:shadow-md sm:flex-row"
					onclick={() => goto(`/saved/${savedPlace.id}`)}
					onkeydown={(e) => e.key === 'Enter' && goto(`/saved/${savedPlace.id}`)}
					tabindex="0"
					role="link"
					aria-label={savedPlace.place.name}
				>
					<div class="h-32 w-full shrink-0 sm:h-auto sm:min-h-32 sm:w-36 sm:self-stretch">
						<StaticMapThumb
							lat={savedPlace.place.location.lat}
							lng={savedPlace.place.location.lng}
							alt={savedPlace.place.name}
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
						<div class="mt-auto pt-1">
							<a
								href={`/place/${savedPlace.place.id}`}
								onclick={(e) => e.stopPropagation()}
								class="text-xs font-medium text-accent hover:underline"
							>
								View place →
							</a>
						</div>
					</div>
				</div>
			{/each}
			{#if loading && !done}
				{#each Array(3) as _u, i (`skeleton-${i}`)}
					<SkeletonCard />
				{/each}
			{/if}
		</div>

		{#if !done}
			<div bind:this={sentinel} class="h-10 w-full"></div>
		{/if}
	{/if}
</div>
