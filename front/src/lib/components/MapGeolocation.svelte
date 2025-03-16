<script lang="ts">
	import * as mapbox from 'mapbox-gl';
	import { onMount } from 'svelte';
	import { CustomGeolocation } from '$lib/utils/geolocation';

	export let map: mapbox.Map;
	export let trackUser: boolean = false;
	export let showUser: boolean = true;
    export let onGeolocate: () => void;
	
	onMount(() => {
		const geolocateControl = new mapbox.GeolocateControl({
			trackUserLocation: trackUser,
			showUserLocation: showUser,
			positionOptions: {
				enableHighAccuracy: true
			},
			geolocation: new CustomGeolocation()
		});

		map.addControl(geolocateControl, 'bottom-right');
		
		geolocateControl.on('geolocate', () => {
			onGeolocate();
		});

		// Trigger geolocation if needed
		if (trackUser || showUser) {
			const loadHandler = () => {
				geolocateControl.trigger();
				map.off('load', loadHandler);
			};
			
			if (map.isStyleLoaded()) {
				geolocateControl.trigger();
			} else {
				map.on('load', loadHandler);
			}
		}

		return () => {
			map.removeControl(geolocateControl);
		};
	});
</script>
