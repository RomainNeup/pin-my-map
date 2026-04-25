<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	onMount(() => {
		// Preserve any existing query params (tagIds, done) when redirecting
		const url = new URL('/profile', window.location.origin);
		url.searchParams.set('tab', 'saved');
		const tagIds = $page.url.searchParams.get('tagIds');
		const done = $page.url.searchParams.get('done');
		if (tagIds) url.searchParams.set('tagIds', tagIds);
		if (done) url.searchParams.set('done', done);
		goto(url.toString(), { replaceState: true });
	});
</script>
