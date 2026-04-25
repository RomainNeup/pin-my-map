<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getSavedPlaces, exportCsv, type SavedPlace } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import SavedTagFilter from '$lib/components/place/SavedTagFilter.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import DoneFilter, { type DoneFilterValue } from '$lib/components/ui/DoneFilter.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import SkeletonCard from '$lib/components/ui/SkeletonCard.svelte';
	import { tags } from '$lib/stores/tags';
	import Check from 'lucide-svelte/icons/check';
	import Download from 'lucide-svelte/icons/download';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Search from 'lucide-svelte/icons/search';

	const PAGE_SIZE = 30;

	type SortKey = 'newest' | 'oldest' | 'rating-desc' | 'name-asc';

	let items = $state<SavedPlace[]>([]);
	let selectedTagIds = $state<string[]>([]);
	let doneFilter = $state<DoneFilterValue>('all');
	let sortBy = $state<SortKey>('newest');
	let loading = $state(false);
	let initialLoaded = $state(false);
	let hasMore = $state(false);
	let exporting = $state(false);

	let requestId = 0;

	// Rehydrate from URL on mount
	onMount(() => {
		const urlTagIds = $page.url.searchParams.get('tagIds');
		if (urlTagIds) {
			selectedTagIds = urlTagIds.split(',').filter(Boolean);
		}
		const urlDone = $page.url.searchParams.get('done');
		if (urlDone === 'todo' || urlDone === 'done') doneFilter = urlDone;
	});

	// Sync URL search params
	function syncUrl(tagIds: string[], done: DoneFilterValue) {
		const url = new URL($page.url);
		if (tagIds.length > 0) {
			url.searchParams.set('tagIds', tagIds.join(','));
		} else {
			url.searchParams.delete('tagIds');
		}
		if (done !== 'all') {
			url.searchParams.set('done', done);
		} else {
			url.searchParams.delete('done');
		}
		goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function fetchPage(reset: boolean) {
		if (loading) return;
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
			hasMore = next.length === PAGE_SIZE;
		} finally {
			if (id === requestId) {
				loading = false;
				initialLoaded = true;
			}
		}
	}

	let filterKey = $derived([...selectedTagIds].sort().join(',') + '|' + doneFilter);
	$effect(() => {
		const _key = filterKey;
		void _key;
		untrack(() => fetchPage(true));
	});

	function onTagsChange(next: string[]) {
		selectedTagIds = next;
		syncUrl(next, doneFilter);
	}

	function onDoneFilterChange(v: DoneFilterValue) {
		doneFilter = v;
		syncUrl(selectedTagIds, v);
	}

	// Client-side done filter + sort
	let sorted = $derived.by(() => {
		const filtered = items.filter((sp) => {
			if (doneFilter === 'done') return sp.done === true;
			if (doneFilter === 'todo') return sp.done !== true;
			return true;
		});
		const copy = [...filtered];
		switch (sortBy) {
			case 'oldest':
				return copy.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			case 'rating-desc':
				return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
			case 'name-asc':
				return copy.sort((a, b) => a.place.name.localeCompare(b.place.name));
			default: // newest
				return copy.sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	});

	// Count of saved places per tag from current loaded set
	let tagCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const sp of items) {
			for (const t of sp.tags ?? []) {
				counts[t.id] = (counts[t.id] ?? 0) + 1;
			}
		}
		return counts;
	});

	// Relative time helper
	function relativeTime(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		const diffMs = Date.now() - d.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		if (diffSec < 60) return 'just now';
		const diffMin = Math.floor(diffSec / 60);
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffH = Math.floor(diffMin / 60);
		if (diffH < 24) return `${diffH}h ago`;
		const diffD = Math.floor(diffH / 24);
		if (diffD < 30) return `${diffD}d ago`;
		const diffMo = Math.floor(diffD / 30);
		if (diffMo < 12) return `${diffMo}mo ago`;
		return `${Math.floor(diffMo / 12)}y ago`;
	}

	async function handleExportCsv() {
		if (exporting) return;
		exporting = true;
		try {
			const blob = await exportCsv();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const today = new Date().toISOString().slice(0, 10);
			a.download = `pin-my-map-saved-${today}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			exporting = false;
		}
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
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">Saved places</h1>
		<div class="flex gap-2">
			<Button
				variant="ghost"
				tone="neutral"
				onclick={handleExportCsv}
				loading={exporting}
				prefix={importPrefix}
			>
				Export CSV
			</Button>
			<Button variant="ghost" tone="neutral" href="/import" prefix={importPrefix}>Import</Button>
			<Button variant="soft" tone="accent" href="/place/search" prefix={searchPrefix}>
				Find new places
			</Button>
		</div>
	</div>

	<!-- Tag filter + done filter + sort row -->
	<div class="mb-4 flex flex-wrap items-center gap-2">
		{#if $tags?.length}
			<div class="min-w-0 flex-1">
				<SavedTagFilter
					tags={$tags}
					bind:selected={selectedTagIds}
					counts={tagCounts}
					onchange={onTagsChange}
				/>
			</div>
		{/if}
		<DoneFilter value={doneFilter} onChange={onDoneFilterChange} />
		<select
			bind:value={sortBy}
			class="h-8 rounded-lg border border-border bg-bg-elevated px-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
		>
			<option value="newest">Newest</option>
			<option value="oldest">Oldest</option>
			<option value="rating-desc">Top rated</option>
			<option value="name-asc">A → Z</option>
		</select>
	</div>

	<!-- Content -->
	{#if !initialLoaded}
		<div class="flex flex-col gap-3">
			{#each Array(6) as _u, i (i)}
				<SkeletonCard />
			{/each}
		</div>
	{:else if sorted.length === 0}
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
		<div class="flex flex-col gap-3">
			{#each sorted as savedPlace (savedPlace.id)}
				<a
					href={`/saved/${savedPlace.id}`}
					class="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm transition-shadow hover:shadow-md sm:flex-row"
				>
					<div class="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
						<!-- Name + done badge -->
						<div class="flex items-start justify-between gap-2">
							<h3 class="truncate font-semibold text-fg">{savedPlace.place.name}</h3>
							<div class="flex shrink-0 items-center gap-1.5">
								{#if savedPlace.done}
									<Chip size="sm" prefix={doneChipPrefix}>Done</Chip>
								{/if}
								<span class="whitespace-nowrap text-xs text-fg-muted">
									{relativeTime(savedPlace.createdAt)}
								</span>
							</div>
						</div>

						<!-- Address -->
						{#if savedPlace.place.address}
							<p class="truncate text-sm text-fg-muted">{savedPlace.place.address}</p>
						{/if}

						<!-- Rating -->
						{#if savedPlace.rating && savedPlace.rating > 0}
							<div class="pt-0.5">
								<StarRating rating={savedPlace.rating} disabled size="0.9rem" />
							</div>
						{/if}

						<!-- Tags -->
						{#if savedPlace.tags && savedPlace.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each savedPlace.tags.slice(0, 4) as tag (tag.id)}
									{#snippet tagPrefix()}
										<span>{tag.emoji}</span>
									{/snippet}
									<Chip size="sm" prefix={tagPrefix}>{tag.name}</Chip>
								{/each}
								{#if savedPlace.tags.length > 4}
									<Chip size="sm">+{savedPlace.tags.length - 4} more</Chip>
								{/if}
							</div>
						{/if}
					</div>
				</a>
			{/each}

			{#if loading}
				{#each Array(3) as _u, i (`skeleton-${i}`)}
					<SkeletonCard />
				{/each}
			{/if}
		</div>

		<!-- Load more -->
		{#if hasMore && !loading}
			<div class="mt-6 flex justify-center">
				<Button variant="outline" tone="neutral" onclick={() => fetchPage(false)}>
					Load more
				</Button>
			</div>
		{/if}
	{/if}
</div>
