<script lang="ts">
	import PublicMapView from '$lib/components/public/PublicMapView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PublicMapView map={data.map} basePath={data.basePath} />
