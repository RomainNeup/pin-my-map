<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { CustomGeolocation } from '$lib/utils/geolocation';
	import Loader from './Loader.svelte';

	const { Map, GeolocateControl } = mapbox;

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

	/**
	 * Component Props Interface
	 */
	interface MapProps {
		/** Longitude coordinate for map center */
		lng?: number;
		/** Latitude coordinate for map center */
		lat?: number;
		/** Initial zoom level (0-22) */
		zoom?: number;
		/** Whether map should center on user's location */
		centerOnUser?: boolean;
		/** Whether map controls are enabled */
		controls?: boolean;
		/** Data sources containing map points */
		sources?: { 
			/** Source identifier */ 
			key: string; 
			/** Points to display */
			points: Point[] 
		}[];
		/** Slot for additional map UI elements */
		children?: Snippet;
	}

	// Props with defaults
	const {
		lng,
		lat,
		zoom = 0,
		centerOnUser = false,
		controls = true,
		sources = $bindable([]),
		children
	}: MapProps = $props();

	// Component state and references
	let map: mapbox.Map;
	let mapContainer: HTMLDivElement | string;
	let loading = $state(centerOnUser);

	onMount(async () => {
		const initialState = { zoom: zoom };
		const geolocateControl = new GeolocateControl({
			trackUserLocation: centerOnUser,
			showUserLocation: centerOnUser,
			positionOptions: {
				enableHighAccuracy: true
			},
			geolocation: new CustomGeolocation()
		});
		map = new Map({
			container: mapContainer,
			accessToken: PUBLIC_MAPBOX_ACCESS_TOKEN,
			style: `mapbox://styles/mapbox/outdoors-v11`,
			zoom: initialState.zoom,
			attributionControl: false,
			center: [lng || 0, lat || 0],
			interactive: controls
		});

		if (centerOnUser) {
			map.addControl(geolocateControl, 'bottom-right');
		}

		map.on('load', () => {
			if (centerOnUser) {
				geolocateControl.trigger();
			}
			if (sources) {
				for (const { key, points } of sources) {
					const source: mapbox.SourceSpecification = {
						type: 'geojson',
						cluster: true,
						data: {
							type: 'FeatureCollection',
							features: points.map(({ id, position }) => ({
								type: 'Feature',
								geometry: {
									type: 'Point',
									coordinates: position
								},
								properties: {
									id
								}
							}))
						}
					};

					map.addSource(key, source);
					// map.addLayer({
					// 	id: `${key}-clustered`,
					// 	type: 'circle',
					// 	source: key,
					// 	filter: ['has', 'point_count'],
					// 	paint: {
					// 		'circle-color': [
					// 			'step',
					// 			['get', 'point_count'],
					// 			'#51bbd6',
					// 			100,
					// 			'#f1f075',
					// 			750,
					// 			'#f28cb1'
					// 		],
					// 		'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
					// 	}
					// });

					// map.addLayer({
					// 	id: `${key}-cluster-count`,
					// 	type: 'symbol',
					// 	source: key,
					// 	filter: ['has', 'point_count'],
					// 	layout: {
					// 		'text-field': ['get', 'point_count_abbreviated'],
					// 		'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					// 		'text-size': 12
					// 	}
					// });

					map.addLayer({
						id: `${key}-unclustered`,
						type: 'circle',
						source: key,
						filter: ['!', ['has', 'point_count']],
						paint: {
							'circle-color': '#11b4da',
							'circle-radius': 10,
							'circle-stroke-width': 1,
							'circle-stroke-color': '#fff'
						}
					});

					// map.on('click', `${key}-clustered`, (e) => {
					// 	const feature = map.queryRenderedFeatures(e.point, { layers: [`${key}-clustered`] })[0];
					// 	if (feature) {
					// 		const clusterId = feature.properties?.cluster_id;
					// 		map.getSource(key)?.getClusterExpansionZoom(clusterId, (err, zoom) => {
					// 			if (err) {
					// 				return;
					// 			}
					// 			map.easeTo({
					// 				center: feature.geometry.coordinates as [number, number],
					// 				zoom: zoom
					// 			});
					// 		});

					// 	}
					// });

					map.on('click', `${key}-unclustered`, (e) => {
						const feature = map.queryRenderedFeatures(e.point, {
							layers: [`${key}-unclustered`]
						})[0];
						if (feature) {
							const id = feature.properties?.id;
							const point = points.find((p) => p.id === id);
							if (point && point.onClick) {
								point.onClick();
							}
						}
					});
				}
			}
		});

		geolocateControl.on('geolocate', () => {
			loading = false;
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="relative h-full w-full">
	<div class="map absolute h-full w-full" bind:this={mapContainer}></div>
	{#if loading}
		<div class="absolute top-0 flex h-full w-full items-center justify-center">
			<Loader />
		</div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
