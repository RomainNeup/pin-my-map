<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import LocateFixed from 'lucide-svelte/icons/locate-fixed';
	import Map from '$lib/components/Map.svelte';
	import Button from '$lib/components/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Skeleton from '$lib/components/ui/Skeleton.svelte';
	import { reverseGeocode } from '$lib/api/mapbox';
	import type * as mapbox from 'mapbox-gl';

	let center = $state<{ lat: number; lng: number } | null>(null);
	let address = $state<string | null>(null);
	let geocoding = $state(false);
	let confirming = $state(false);
	let locating = $state(false);

	let attachedMap: mapbox.Map | null = null;
	let moveendHandler: (() => void) | null = null;
	let movestartHandler: (() => void) | null = null;
	let debounceHandle: ReturnType<typeof setTimeout> | null = null;
	let lastGeocodeKey = '';

	const keyOf = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

	const refreshAddress = async (lat: number, lng: number) => {
		const key = keyOf(lat, lng);
		if (key === lastGeocodeKey) return;
		lastGeocodeKey = key;
		geocoding = true;
		try {
			const r = await reverseGeocode(lng, lat);
			if (keyOf(center!.lat, center!.lng) === key) {
				address = r.address;
			}
		} catch {
			address = null;
		} finally {
			if (keyOf(center!.lat, center!.lng) === key) geocoding = false;
		}
	};

	const updateFromMap = () => {
		if (!attachedMap) return;
		const c = attachedMap.getCenter();
		center = { lat: c.lat, lng: c.lng };
		if (debounceHandle) clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => refreshAddress(c.lat, c.lng), 350);
	};

	const onMoveStart = () => {
		address = null;
	};

	const handleMapReady = (map: mapbox.Map) => {
		attachedMap = map;
		moveendHandler = updateFromMap;
		movestartHandler = onMoveStart;
		map.on('moveend', moveendHandler);
		map.on('movestart', movestartHandler);
		updateFromMap();
	};

	onDestroy(() => {
		if (debounceHandle) clearTimeout(debounceHandle);
		if (attachedMap) {
			if (moveendHandler) attachedMap.off('moveend', moveendHandler);
			if (movestartHandler) attachedMap.off('movestart', movestartHandler);
		}
	});

	const useMyLocation = () => {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				if (attachedMap) {
					attachedMap.flyTo({
						center: [pos.coords.longitude, pos.coords.latitude],
						zoom: Math.max(attachedMap.getZoom(), 14),
						essential: true
					});
				}
				locating = false;
			},
			() => {
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	};

	const confirm = async () => {
		if (!center || confirming) return;
		confirming = true;
		// If we don't have an address yet, try one last time (short timeout).
		let finalAddress = address;
		if (!finalAddress) {
			try {
				const r = await reverseGeocode(center.lng, center.lat);
				finalAddress = r.address;
			} catch {
				finalAddress = null;
			}
		}
		const params = new URLSearchParams({
			lat: center.lat.toFixed(6),
			lng: center.lng.toFixed(6)
		});
		if (finalAddress) params.set('address', finalAddress);
		goto(`/place/create?${params.toString()}`);
	};
</script>

<div class="relative h-dvh w-full overflow-hidden">
	<Map centerOnUser controls onReady={handleMapReady}>
		<!-- Top bar -->
		<div class="pointer-events-none absolute inset-x-0 top-0 z-overlay px-3 pt-3 md:px-6">
			<div class="pointer-events-auto flex items-center gap-2">
				<IconButton
					href="/"
					label="Back"
					variant="soft"
					class="bg-bg-elevated/90 shadow-md backdrop-blur-sm"
				>
					{#snippet icon()}<ArrowLeft class="h-5 w-5" />{/snippet}
				</IconButton>
				<div
					class="bg-bg-elevated/90 rounded-full border border-border px-3 py-1.5 text-sm font-medium shadow-md backdrop-blur-sm"
				>
					Move the map to pick a location
				</div>
			</div>
		</div>

		<!-- Centered crosshair pin -->
		<div
			class="pointer-events-none absolute left-1/2 top-1/2 z-overlay -translate-x-1/2 -translate-y-full"
		>
			<div class="flex flex-col items-center">
				<div
					class="ring-bg/40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg ring-4"
				>
					<MapPin class="h-6 w-6" fill="currentColor" strokeWidth={1.5} />
				</div>
				<div class="-mt-1 h-3 w-3 rotate-45 bg-accent shadow-md"></div>
				<div class="bg-fg/40 mt-1 h-1.5 w-1.5 rounded-full"></div>
			</div>
		</div>

		<!-- "Use my location" button -->
		<div
			class="absolute bottom-[calc(var(--tabbar-h)+11rem)] right-3 z-overlay md:bottom-40 md:right-6"
		>
			<IconButton
				label="Use my location"
				variant="soft"
				onclick={useMyLocation}
				disabled={locating}
				class="bg-bg-elevated/95 shadow-md backdrop-blur-sm"
			>
				{#snippet icon()}<LocateFixed class="h-5 w-5" />{/snippet}
			</IconButton>
		</div>

		<!-- Bottom confirmation card -->
		<div class="absolute inset-x-0 bottom-(--tabbar-h) z-overlay p-3 md:bottom-0 md:p-6">
			<div
				class="bg-bg-elevated/95 mx-auto max-w-md space-y-3 rounded-2xl border border-border p-4 shadow-xl backdrop-blur-sm"
			>
				<div class="flex items-start gap-3">
					<span
						class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
					>
						<MapPin class="h-4 w-4" />
					</span>
					<div class="min-w-0 flex-1">
						{#if geocoding || address === null}
							<div class="space-y-1.5">
								<Skeleton h="h-4" w="w-3/4" />
								<Skeleton h="h-3" w="w-1/2" />
							</div>
						{:else}
							<p class="truncate text-sm font-medium">{address}</p>
						{/if}
						{#if center}
							<p class="mt-1 font-mono text-xs text-fg-subtle">
								{center.lat.toFixed(5)}, {center.lng.toFixed(5)}
							</p>
						{/if}
					</div>
				</div>
				<Button fullwidth onclick={confirm} loading={confirming} disabled={!center}>
					Use this location
				</Button>
			</div>
		</div>
	</Map>
</div>
