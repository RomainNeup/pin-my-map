<script lang="ts" module>
	export interface Point {
		id: string;
		position: [number, number];
		onClick?: () => void;
		tagIds?: string[];
		name?: string;
		rating?: number;
	}

	export interface MapSource {
		key: string;
		points: Point[];
		tagFilter?: string[];
	}
</script>

<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, type Snippet } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { theme } from '$lib/stores/theme';
	import { styleForTheme } from '$lib/stores/mapStore';
	import Loader from './Loader.svelte';
	import MapGeolocation from './MapGeolocation.svelte';
	import MapPoints from './MapPoints.svelte';

	interface MapProps {
		lng?: number;
		lat?: number;
		zoom?: number;
		centerOnUser?: boolean;
		controls?: boolean;
		sources?: MapSource[];
		onMapClick?: (ll: { lat: number; lng: number }) => void;
		onReady?: (map: mapbox.Map) => void;
		children?: Snippet;
	}

	const {
		lng = 0,
		lat = 0,
		zoom = 0,
		centerOnUser = false,
		controls = true,
		sources = [],
		onMapClick,
		onReady,
		children
	}: MapProps = $props();

	let mapContainer: HTMLDivElement;
	let loading = $state(centerOnUser);
	let map: mapbox.Map | undefined = $state();

	onMount(() => {
		const resolved = theme.resolved();
		const instance = new mapbox.Map({
			container: mapContainer,
			accessToken: env.PUBLIC_MAPBOX_ACCESS_TOKEN,
			style: styleForTheme(resolved),
			attributionControl: false,
			zoom,
			center: [lng, lat],
			interactive: controls
		});
		map = instance;
		onReady?.(instance);

		// Theme-driven style swap (skip the synchronous initial fire)
		let firstFire = true;
		const themeUnsub = theme.subscribe(() => {
			if (firstFire) {
				firstFire = false;
				return;
			}
			if (!instance.isStyleLoaded()) return;
			const r = theme.resolved();
			const current = instance.getStyle()?.sprite ?? '';
			const wantsDark = r === 'dark';
			if (wantsDark !== current.includes('dark')) {
				instance.setStyle(styleForTheme(r));
			}
		});

		// Geolocation timeout safety
		let loadingTimer: ReturnType<typeof setTimeout> | null = null;
		if (centerOnUser) {
			loadingTimer = setTimeout(() => {
				loading = false;
			}, 5000);
		}

		// Click-to-create: only when click didn't hit a marker/cluster layer
		const clickHandler = (e: mapbox.MapMouseEvent) => {
			if (!onMapClick) return;
			const layersToCheck: string[] = [];
			for (const s of sources) {
				layersToCheck.push(`${s.key}-unclustered`, `${s.key}-clusters`, `${s.key}-cluster-count`);
			}
			const existingLayers = layersToCheck.filter((id) => instance.getLayer(id));
			if (existingLayers.length) {
				const features = instance.queryRenderedFeatures(e.point, { layers: existingLayers });
				if (features.length > 0) return;
			}
			onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
		};
		if (onMapClick) instance.on('click', clickHandler);

		// Long-press for touch
		let longPressTimer: ReturnType<typeof setTimeout> | null = null;
		let longPressStart: { x: number; y: number } | null = null;
		const clearLongPress = () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
			longPressStart = null;
		};
		const onTouchStart = (e: TouchEvent) => {
			if (!onMapClick || e.touches.length !== 1) return;
			const t = e.touches[0];
			longPressStart = { x: t.clientX, y: t.clientY };
			longPressTimer = setTimeout(() => {
				if (!longPressStart) return;
				const rect = mapContainer.getBoundingClientRect();
				const pt = instance.unproject([
					longPressStart.x - rect.left,
					longPressStart.y - rect.top
				]);
				onMapClick?.({ lat: pt.lat, lng: pt.lng });
				clearLongPress();
			}, 500);
		};
		const onTouchMove = (e: TouchEvent) => {
			if (!longPressStart || e.touches.length !== 1) return;
			const t = e.touches[0];
			const dx = t.clientX - longPressStart.x;
			const dy = t.clientY - longPressStart.y;
			if (Math.hypot(dx, dy) > 8) clearLongPress();
		};
		if (onMapClick) {
			mapContainer.addEventListener('touchstart', onTouchStart, { passive: true });
			mapContainer.addEventListener('touchmove', onTouchMove, { passive: true });
			mapContainer.addEventListener('touchend', clearLongPress);
			mapContainer.addEventListener('touchcancel', clearLongPress);
		}

		return () => {
			if (loadingTimer) clearTimeout(loadingTimer);
			themeUnsub();
			if (onMapClick) instance.off('click', clickHandler);
			mapContainer.removeEventListener('touchstart', onTouchStart);
			mapContainer.removeEventListener('touchmove', onTouchMove);
			mapContainer.removeEventListener('touchend', clearLongPress);
			mapContainer.removeEventListener('touchcancel', clearLongPress);
			instance.remove();
			map = undefined;
		};
	});

	const handleGeolocate = () => {
		loading = false;
	};
</script>

<div class="relative h-full w-full">
	<div class="absolute h-full w-full" bind:this={mapContainer}></div>

	{#if map}
		{#if centerOnUser}
			<MapGeolocation
				{map}
				trackUser={centerOnUser}
				showUser={centerOnUser}
				onGeolocate={handleGeolocate}
			/>
		{/if}

		{#each sources as source (source.key)}
			<MapPoints
				{map}
				sourceKey={source.key}
				points={source.points}
				tagFilter={source.tagFilter ?? []}
			/>
		{/each}
	{/if}

	{#if loading}
		<div class="bg-bg/60 absolute inset-0 flex items-center justify-center">
			<Loader size="lg" />
		</div>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>
