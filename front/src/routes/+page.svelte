<script lang="ts">
	import { onMount } from 'svelte';
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
	import DropPinSheet from '$lib/components/map/DropPinSheet.svelte';

	let loading = $state(true);
	let selectedTagIds = $state<string[]>([]);

	let sheetOpen = $state(false);
	let sheetMode = $state<'place' | 'drop' | null>(null);
	let selectedPlace = $state<SavedPlace | null>(null);
	let dropCoords = $state<{ lat: number; lng: number } | null>(null);

	const source = $derived<MapSource>({
		key: 'saved-places',
		points: $savedPlaces.map((sp) => ({
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
		sheetMode = 'place';
		sheetOpen = true;
	};

	const handleMapClick = ({ lat, lng }: { lat: number; lng: number }) => {
		dropCoords = { lat, lng };
		sheetMode = 'drop';
		sheetOpen = true;
	};

	const closeSheet = () => {
		sheetOpen = false;
		selectedPlace = null;
		dropCoords = null;
		sheetMode = null;
	};

	onMount(async () => {
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

<div class="relative h-[100dvh] w-full overflow-hidden">
	{#snippet plusIcon()}<Plus class="h-6 w-6" />{/snippet}
	<Map centerOnUser sources={[source]} onMapClick={handleMapClick}>
		<div
			class="pointer-events-none absolute inset-x-0 top-14 z-overlay flex flex-col gap-2 px-3 pt-3 md:px-6"
		>
			<div class="pointer-events-auto w-full max-w-md self-center md:self-start">
				<SearchBar />
			</div>
			{#if $tags?.length}
				<div class="pointer-events-auto pt-1">
					<TagFilterChips
						tags={$tags}
						bind:selected={selectedTagIds}
						onChange={(v) => (selectedTagIds = v)}
					/>
				</div>
			{/if}
		</div>

		<Fab icon={plusIcon} label="Add place" href="/place/create" offset={72} />

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
					description="Long-press the map to drop a pin, or add one from search."
				>
					{#snippet icon()}<MapPin class="h-5 w-5" />{/snippet}
					{#snippet action()}
						<Button href="/place/search" variant="soft">Search places</Button>
					{/snippet}
				</EmptyState>
			</div>
		</div>
	{/if}

	<Sheet
		bind:open={sheetOpen}
		onClose={closeSheet}
		title={sheetMode === 'drop' ? 'New place' : undefined}
	>
		{#if sheetMode === 'place' && selectedPlace}
			<PlaceSheet savedPlace={selectedPlace} />
		{:else if sheetMode === 'drop' && dropCoords}
			<DropPinSheet lat={dropCoords.lat} lng={dropCoords.lng} onCancel={closeSheet} />
		{/if}
	</Sheet>
</div>
