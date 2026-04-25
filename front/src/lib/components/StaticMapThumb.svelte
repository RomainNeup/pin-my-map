<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { staticMapUrl } from '$lib/utils/mapboxStatic';

	type Props = {
		lat: number;
		lng: number;
		zoom?: number;
		width?: number;
		height?: number;
		alt?: string;
	};

	let { lat, lng, zoom = 14, width = 288, height = 256, alt = '' }: Props = $props();

	const resolved = $derived(
		$theme === 'dark' || ($theme === 'system' && theme.resolved() === 'dark') ? 'dark' : 'light'
	);

	const src = $derived(staticMapUrl({ lng, lat, zoom, width, height, theme: resolved }));
</script>

<img
	{src}
	{alt}
	loading="lazy"
	decoding="async"
	class="h-full w-full object-cover"
	{width}
	{height}
/>
