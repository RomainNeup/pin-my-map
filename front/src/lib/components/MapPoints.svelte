<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import { onMount } from 'svelte';
	import type { Point } from './Map.svelte';

	export let map: mapbox.Map;
	export let sourceKey: string;
	export let points: Point[] = [];

	onMount(() => {
		const addPointsToMap = () => {
			// Skip if map is not loaded yet
			if (!map.isStyleLoaded()) return;

			// Create source
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
						properties: { id }
					}))
				}
			};

			// Add source to map
			map.addSource(sourceKey, source);

			// Add unclustered point layer
			map.addLayer({
				id: `${sourceKey}-unclustered`,
				type: 'circle',
				source: sourceKey,
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#11b4da',
					'circle-radius': 10,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			// Add click handlers
			map.on('click', `${sourceKey}-unclustered`, (e) => {
				const feature = map.queryRenderedFeatures(e.point, {
					layers: [`${sourceKey}-unclustered`]
				})[0];
				
				if (feature) {
					const id = feature.properties?.id;
					const point = points.find((p) => p.id === id);
					if (point && point.onClick) {
						point.onClick();
					}
				}
			});
		};

		// If map is already loaded, add points immediately
		if (map.isStyleLoaded()) {
			addPointsToMap();
		} else {
			// Otherwise wait for load event
			const loadHandler = () => {
				addPointsToMap();
				map.off('load', loadHandler);
			};
			map.on('load', loadHandler);
		}

		return () => {
			// Clean up on unmount
			if (map.getLayer(`${sourceKey}-unclustered`)) {
				map.removeLayer(`${sourceKey}-unclustered`);
			}
			if (map.getSource(sourceKey)) {
				map.removeSource(sourceKey);
			}
		};
	});
</script>
