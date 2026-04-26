<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type * as mapboxgl from 'mapbox-gl';
	import Plus from 'lucide-svelte/icons/plus';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { getSavedPlaces, type SavedPlace } from '$lib/api/savedPlace';
	import { savedPlaces } from '$lib/stores/place';
	import { tags } from '$lib/stores/tags';
	import Map, { type MapSource } from '$lib/components/Map.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Fab from '$lib/components/ui/Fab.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Button from '$lib/components/Button.svelte';
	import SearchBar from '$lib/components/map/SearchBar.svelte';
	import TagFilterChips from '$lib/components/map/TagFilterChips.svelte';
	import PlaceSheet from '$lib/components/map/PlaceSheet.svelte';
	import DoneFilter, { type DoneFilterValue } from '$lib/components/ui/DoneFilter.svelte';

	let loading = $state(true);
	let selectedTagIds = $state<string[]>([]);
	let doneFilter = $state<DoneFilterValue>('all');

	let sheetOpen = $state(false);
	let selectedPlace = $state<SavedPlace | null>(null);
	let mapInstance = $state<mapboxgl.Map | undefined>();

	// Filtered places based on done state
	const filteredPlaces = $derived(
		$savedPlaces.filter((sp) => {
			if (doneFilter === 'done') return sp.done === true;
			if (doneFilter === 'todo') return sp.done !== true;
			return true;
		})
	);

	const source = $derived<MapSource>({
		key: 'saved-places',
		points: filteredPlaces.map((sp) => ({
			id: sp.place.id,
			position: [sp.place.location.lng, sp.place.location.lat] as [number, number],
			name: sp.place.name,
			tagIds: sp.tags?.map((t) => t.id) ?? [],
			onClick: () => openPlace(sp)
		})),
		tagFilter: selectedTagIds
	});

	const openPlace = (sp: SavedPlace) => {
		selectedPlace = sp;
		sheetOpen = true;
	};

	const onSearchSelect = (sp: SavedPlace) => {
		if (mapInstance && sp.place.location) {
			mapInstance.flyTo({
				center: [sp.place.location.lng, sp.place.location.lat],
				zoom: Math.max(mapInstance.getZoom(), 14),
				duration: 800
			});
		}
		openPlace(sp);
	};

	const closeSheet = () => {
		sheetOpen = false;
		selectedPlace = null;
	};

	function syncUrl() {
		const url = new URL($page.url);
		if (doneFilter !== 'all') {
			url.searchParams.set('done', doneFilter);
		} else {
			url.searchParams.delete('done');
		}
		goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	function onDoneFilterChange(v: DoneFilterValue) {
		doneFilter = v;
		syncUrl();
	}

	onMount(async () => {
		// Rehydrate done filter from URL
		const urlDone = $page.url.searchParams.get('done');
		if (urlDone === 'todo' || urlDone === 'done') doneFilter = urlDone;

		try {
			const places = await getSavedPlaces();
			if (places) savedPlaces.set(places);
		} catch {
			// toast handled by axios interceptor
		} finally {
			loading = false;
		}
	});
</script>

<div class="relative h-dvh w-full overflow-hidden">
	{#snippet plusIcon()}<Plus class="h-6 w-6" />{/snippet}
	<Map centerOnUser sources={[source]} onReady={(m) => (mapInstance = m)}>
		<div
			class="pointer-events-none absolute inset-x-0 top-0 z-overlay flex flex-col gap-2 px-3 pt-3 md:top-16 md:px-6"
			style="padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));"
		>
			<div class="pointer-events-auto w-full max-w-md self-center md:self-start">
				<SearchBar onSelect={onSearchSelect} />
			</div>
			<div class="pointer-events-auto flex items-center gap-2 pt-1">
				{#if $tags?.length}
					<div class="min-w-0 flex-1">
						<TagFilterChips
							tags={$tags}
							bind:selected={selectedTagIds}
							onChange={(v) => (selectedTagIds = v)}
						/>
					</div>
				{/if}
				<DoneFilter value={doneFilter} onChange={onDoneFilterChange} />
			</div>
		</div>

		<Fab icon={plusIcon} label="Add place" href="/place/pick" offset={72} />

		{#if loading}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
				<Loader size="lg" />
			</div>
		{/if}
	</Map>

	{#if !loading && $savedPlaces.length === 0}
		<div
			class="pointer-events-none absolute inset-x-0 bottom-24 z-fab flex justify-center px-3 md:bottom-8"
		>
			<div
				class="pointer-events-auto max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-lg"
			>
				<EmptyState
					title="No places pinned yet"
					description="Tap the + button to pick a location or search."
				>
					{#snippet icon()}<MapPin class="h-5 w-5" />{/snippet}
					{#snippet action()}
						<div class="flex gap-2">
							<Button href="/place/pick">Add a place</Button>
							<Button href="/place/search" variant="soft">Search</Button>
						</div>
					{/snippet}
				</EmptyState>
			</div>
		</div>
	{/if}

	<Sheet bind:open={sheetOpen} onClose={closeSheet}>
		{#if selectedPlace}
			<PlaceSheet savedPlace={selectedPlace} />
		{/if}
	</Sheet>
</div>
