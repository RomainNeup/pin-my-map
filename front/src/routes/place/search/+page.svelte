<script lang="ts">
	import { searchPlaces, type Place } from '$lib/api/place';
	import { type Tag } from '$lib/api/tag';
	import Button from '$lib/components/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { tags } from '$lib/stores/tags';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import X from 'lucide-svelte/icons/x';

	let query = $state('');
	let results = $state<Place[] | null>(null);
	let loading = $state(false);
	let filterOpen = $state(false);
	let selectedTagIds = $state<string[]>([]);
	let filterAnchor = $state<HTMLElement | null>(null);

	let debounceHandle: ReturnType<typeof setTimeout> | null = null;

	const runSearch = async (q: string) => {
		loading = true;
		try {
			const places = await searchPlaces(q);
			results = places;
		} finally {
			loading = false;
		}
	};

	const onInput = () => {
		if (debounceHandle) clearTimeout(debounceHandle);
		if (query.length < 3) {
			results = null;
			loading = false;
			return;
		}
		const q = query;
		debounceHandle = setTimeout(() => runSearch(q), 300);
	};

	const clearSearch = () => {
		query = '';
		results = null;
		loading = false;
		if (debounceHandle) clearTimeout(debounceHandle);
	};

	const toggleTag = (tagId: string) => {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	};

	// Client-side tag filter (ANY match)
	const filteredResults = $derived.by(() => {
		if (!results) return null;
		if (selectedTagIds.length === 0) return results;
		// Place doesn't carry tags, so this is a no-op filter until places carry tag metadata.
		// Kept here to wire the UI; intersection logic runs against an empty tags array safely.
		return results.filter((p) => {
			const placeTags = (p as Place & { tags?: Tag[] }).tags ?? [];
			return placeTags.some((t) => selectedTagIds.includes(t.id));
		});
	});
</script>

{#snippet filterIcon()}<SlidersHorizontal class="h-5 w-5" />{/snippet}
{#snippet searchEmptyIcon()}<Search class="h-6 w-6" />{/snippet}
{#snippet noResultsIcon()}<MapPinIcon class="h-6 w-6" />{/snippet}
{#snippet createAction()}
	<Button variant="solid" tone="accent" href="/place/create" prefix={plusPrefix}>
		Create a place
	</Button>
{/snippet}
{#snippet plusPrefix()}<Plus class="h-4 w-4" />{/snippet}

<div class="mx-auto w-full max-w-3xl px-4 py-4 md:py-6">
	<div class="mb-4 flex items-center gap-2">
		<div class="relative flex-1">
			<Search
				class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
			/>
			<input
				type="text"
				bind:value={query}
				oninput={onInput}
				placeholder="Search places..."
				class="block h-11 w-full rounded-lg border border-border bg-bg-elevated pl-10 pr-10 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-hidden focus:ring-2 focus:ring-accent"
			/>
			{#if query.length > 0}
				<button
					type="button"
					onclick={clearSearch}
					aria-label="Clear search"
					class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-bg-muted"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>

		<div class="relative" bind:this={filterAnchor}>
			<IconButton
				label="Filters"
				variant="outline"
				tone="neutral"
				onclick={() => (filterOpen = !filterOpen)}
				icon={filterIcon}
			/>
			<Popover
				bind:open={filterOpen}
				anchor={filterAnchor}
				placement="bottom-end"
				class="min-w-[240px] p-3"
			>
				<h4 class="mb-2 text-sm font-medium text-fg">Filter by tag</h4>
				{#if $tags && $tags.length > 0}
					<div class="flex flex-wrap gap-1.5">
						{#each $tags as tag (tag.id)}
							<Chip
								size="sm"
								prefix={tag.emoji}
								selected={selectedTagIds.includes(tag.id)}
								onclick={() => toggleTag(tag.id)}
							>
								{tag.name}
							</Chip>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-fg-muted">No tags yet.</p>
				{/if}
			</Popover>
		</div>
	</div>

	{#if results === null && !loading}
		<EmptyState
			title="Search for places"
			description="Type at least 3 characters"
			icon={searchEmptyIcon}
		/>
	{:else if loading}
		<div class="space-y-2">
			{#each Array(8) as _u, i (i)}
				<div class="flex items-center gap-3 px-3 py-3">
					<Skeleton w="w-10" h="h-10" rounded="full" />
					<div class="flex-1 space-y-2">
						<Skeleton w="w-3/5" h="h-4" />
						<Skeleton w="w-4/5" h="h-3" />
					</div>
				</div>
			{/each}
		</div>
	{:else if filteredResults && filteredResults.length === 0}
		<EmptyState
			title="No places match"
			description="Try a different query or create a new place."
			icon={noResultsIcon}
			action={createAction}
		/>
	{:else if filteredResults}
		<div class="space-y-1">
			{#each filteredResults as place (place.id)}
				<a
					href={`/place/${place.id}`}
					class="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-bg-muted"
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
					>
						<MapPinIcon class="h-5 w-5" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate font-medium text-fg">{place.name}</div>
						<div class="truncate text-sm text-fg-muted">{place.address}</div>
					</div>
					<ChevronRight class="h-5 w-5 shrink-0 text-fg-subtle" />
				</a>
			{/each}
		</div>
	{/if}
</div>
