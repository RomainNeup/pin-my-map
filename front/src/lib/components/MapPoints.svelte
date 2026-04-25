<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import { onMount } from 'svelte';
	import type { Point } from './Map.svelte';

	interface Props {
		map: mapbox.Map;
		sourceKey: string;
		points: Point[];
		tagFilter?: string[];
	}

	let { map, sourceKey, points, tagFilter = [] }: Props = $props();

	const clusterLayer = `${sourceKey}-clusters`;
	const clusterCountLayer = `${sourceKey}-cluster-count`;
	const unclusteredLayer = `${sourceKey}-unclustered`;

	function buildFeatures(list: Point[]) {
		const tagSet = new Set(tagFilter);
		const filtered = tagSet.size
			? list.filter((p) => p.tagIds?.some((id) => tagSet.has(id)))
			: list;
		return filtered.map((p) => ({
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: p.position },
			properties: { id: p.id, name: p.name ?? '', tagIdsCsv: (p.tagIds ?? []).join(',') }
		}));
	}

	function addEverything() {
		if (!map.isStyleLoaded()) return;
		if (map.getSource(sourceKey)) return; // already added

		map.addSource(sourceKey, {
			type: 'geojson',
			cluster: true,
			clusterMaxZoom: 14,
			clusterRadius: 50,
			data: { type: 'FeatureCollection', features: buildFeatures(points) }
		});

		map.addLayer({
			id: clusterLayer,
			type: 'circle',
			source: sourceKey,
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': ['step', ['get', 'point_count'], '#ccfbf1', 10, '#5eead4', 50, '#0d9488'],
				'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
				'circle-stroke-width': 2,
				'circle-stroke-color': '#ffffff'
			}
		});

		map.addLayer({
			id: clusterCountLayer,
			type: 'symbol',
			source: sourceKey,
			filter: ['has', 'point_count'],
			layout: {
				'text-field': ['get', 'point_count_abbreviated'],
				'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
				'text-size': 12
			},
			paint: { 'text-color': '#134e4a' }
		});

		map.addLayer({
			id: unclusteredLayer,
			type: 'circle',
			source: sourceKey,
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': '#0d9488',
				'circle-radius': 8,
				'circle-stroke-width': 2,
				'circle-stroke-color': '#ffffff'
			}
		});

		map.on('click', clusterLayer, (e) => {
			const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayer] });
			const clusterId = features[0]?.properties?.cluster_id;
			const src = map.getSource(sourceKey);
			if (clusterId != null && src && 'getClusterExpansionZoom' in src) {
				(src as mapbox.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
					if (err || zoom == null) return;
					const geom = features[0].geometry as { type: 'Point'; coordinates: [number, number] };
					map.easeTo({ center: geom.coordinates as [number, number], zoom });
				});
			}
		});

		map.on('click', unclusteredLayer, (e) => {
			const feature = map.queryRenderedFeatures(e.point, { layers: [unclusteredLayer] })[0];
			const id = feature?.properties?.id;
			const point = points.find((p) => p.id === id);
			if (point) {
				point.onClick?.();
			}
		});

		map.on('mouseenter', clusterLayer, () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', clusterLayer, () => (map.getCanvas().style.cursor = ''));
		map.on('mouseenter', unclusteredLayer, () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', unclusteredLayer, () => (map.getCanvas().style.cursor = ''));
	}

	function removeEverything() {
		for (const id of [clusterLayer, clusterCountLayer, unclusteredLayer]) {
			if (map.getLayer(id)) map.removeLayer(id);
		}
		if (map.getSource(sourceKey)) map.removeSource(sourceKey);
	}

	function refreshData() {
		const src = map.getSource(sourceKey);
		if (src && 'setData' in src) {
			(src as mapbox.GeoJSONSource).setData({
				type: 'FeatureCollection',
				features: buildFeatures(points)
			});
		}
	}

	onMount(() => {
		if (map.isStyleLoaded()) addEverything();
		else map.once('load', addEverything);

		// setStyle (theme swap) drops all sources/layers. `style.load` fires exactly
		// once per style swap, after the new style is ready to accept them again.
		const onStyleLoad = () => addEverything();
		map.on('style.load', onStyleLoad);

		return () => {
			map.off('style.load', onStyleLoad);
			try {
				removeEverything();
			} catch {
				// Map may already be destroyed
			}
		};
	});

	// Refresh features when props change
	$effect(() => {
		// Depend on points and tagFilter
		void points;
		void tagFilter;
		if (map.getSource(sourceKey)) refreshData();
	});
</script>
