<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, type Snippet } from 'svelte';
	import { mapStore } from '$lib/stores/mapStore';
	import Loader from './Loader.svelte';
	import MapGeolocation from './MapGeolocation.svelte';
	import MapPoints from './MapPoints.svelte';

	/**
	 * Map point definition
	 */
	export interface Point {
		/** Unique identifier for the point */
		id: string;
		/** Geographic coordinates [longitude, latitude] */
		position: [number, number];
		/** Function called when point is clicked */
		onClick?: () => void;
	}

	// Props with defaults
	const {
		lng = 0,
		lat = 0,
		zoom = 0,
		centerOnUser = false,
		controls = true,
		sources = $bindable([]),
		children
	} = $props<{
		lng?: number;
		lat?: number;
		zoom?: number;
		centerOnUser?: boolean;
		controls?: boolean;
		sources?: { key: string; points: Point[] }[];
		children?: Snippet;
	}>();

	// Component state and references
	let mapContainer: HTMLDivElement;
	let loading = $state(centerOnUser);
	let map: mapbox.Map | undefined = $state();

	onMount(() => {
		map = mapStore.init(mapContainer, {
			zoom,
			center: [lng, lat],
			interactive: controls
		});

		return () => {
			mapStore.destroy();
		};
	});

	// Function to handle when geolocation is complete
	const handleGeolocationComplete = () => {
		loading = false;
	};
</script>

<div class="relative h-full w-full">
	<div class="map absolute h-full w-full" bind:this={mapContainer}></div>

	{#if map}
		{#if centerOnUser}
			<MapGeolocation
				{map}
				trackUser={centerOnUser}
				showUser={centerOnUser}
				onGeolocate={handleGeolocationComplete}
			/>
		{/if}

		{#if sources && sources.length > 0}
			{#each sources as source}
				<MapPoints {map} sourceKey={source.key} points={source.points} />
			{/each}
		{/if}
	{/if}

	{#if loading}
		<div class="absolute top-0 flex h-full w-full items-center justify-center">
			<Loader />
		</div>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>
