<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import { onMount } from 'svelte';
	import { CustomGeolocation } from '$lib/utils/geolocation';

	interface Props {
		map: mapbox.Map;
		trackUser?: boolean;
		showUser?: boolean;
		onGeolocate?: () => void;
	}

	const { map, trackUser = false, showUser = true, onGeolocate }: Props = $props();

	onMount(() => {
		const control = new mapbox.GeolocateControl({
			trackUserLocation: trackUser,
			showUserLocation: showUser,
			positionOptions: { enableHighAccuracy: true },
			geolocation: new CustomGeolocation()
		});

		map.addControl(control, 'bottom-right');
		control.on('geolocate', () => onGeolocate?.());

		if (trackUser || showUser) {
			const trigger = () => control.trigger();
			if (map.isStyleLoaded()) trigger();
			else {
				const handler = () => {
					trigger();
					map.off('load', handler);
				};
				map.on('load', handler);
			}
		}

		return () => {
			try {
				map.removeControl(control);
			} catch {
				// Map may already be destroyed
			}
		};
	});
</script>
