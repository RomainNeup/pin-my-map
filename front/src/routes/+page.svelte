<script lang="ts">
	import { getSavedPlaces, type SavedPlace } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import Label from '$lib/components/Label.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Map, { type Point } from '$lib/components/Map.svelte';
	import { savedPlaces } from '$lib/store/place';
	import { tags } from '$lib/store/tags';
	import { onMount } from 'svelte';

	let loading = true;
	let source: { key: string; points: Point[] };

	let selectedPlace: SavedPlace;
	let allTags = $tags;
	let showTags = true;

	savedPlaces.subscribe((places) => {
		source = {
			key: 'places',
			points: places.map((savedPlace) => ({
				id: savedPlace.place.id,
				position: [savedPlace.place.location.lng, savedPlace.place.location.lat],
				onClick: () => {
					selectedPlace = savedPlace;
				}
			}))
		};
	});

	onMount(() =>
		getSavedPlaces()
			.then((places) => {
				savedPlaces.set(places);
				selectedPlace = places[0];
				console.log(selectedPlace);
				loading = false;
			})
			.catch((err) => {
				console.error(err);
			})
	);
</script>

<div class="flex h-full">
	{#if loading}
		<div class="flex h-full w-full items-center justify-center">
			<Loader />
		</div>
	{:else}
		{#if allTags && showTags}
			<div class="flex h-full w-fit flex-col bg-white p-4">
				<div class="grow">
					{#each allTags as tag}
						<div class="text-nowrap border-b py-2">
							{tag.emoji}
							{tag.name}
						</div>
					{/each}
				</div>
				<div class="z-50">
					<Button onClick={() => (showTags = !showTags)}>Add tag</Button>
				</div>
			</div>
		{/if}
		<Map centerOnUser sources={[source]}>
			<div class="absolute bottom-0 z-50 p-4">
				<Button onClick={() => (showTags = !showTags)}>Tags</Button>
			</div>
		</Map>
		{#if selectedPlace}
			<div class="h-full bg-white p-4">
				<h2 class="text-lg font-bold">{selectedPlace.place.name}</h2>
				<p>{selectedPlace.place.description}</p>
				<div class="py-2">
					{#each selectedPlace.tags as tag}
						<Label prefix={tag.emoji}>{tag.name}</Label>
					{/each}
				</div>
				<Button href={`/saved/${selectedPlace.id}`}>View</Button>
				<Button href={`/place/${selectedPlace.place.id}`}>Edit</Button>
			</div>
		{/if}
	{/if}
</div>
