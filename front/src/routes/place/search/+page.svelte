<script lang="ts">
	import { searchPlaces, type Place } from '$lib/api/place';
	import Button from '$lib/components/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';

	let query = $state('');
	let results = $state<Place[] | null>(null);
	let loading = $state(false);

	let debounceHandle: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	const runSearch = async (q: string) => {
		const id = ++requestId;
		loading = true;
		try {
			const places = await searchPlaces(q);
			if (id !== requestId) return;
			results = places;
		} finally {
			if (id === requestId) loading = false;
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
</script>

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
		<div class="relative w-full">
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
	{:else if results && results.length === 0}
		<EmptyState
			title="No places match"
			description="Try a different query or create a new place."
			icon={noResultsIcon}
			action={createAction}
		/>
	{:else if results}
		<div class="space-y-1">
			{#each results as place (place.id)}
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
