<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/profile?tab=following', { replaceState: true });
	});
</script>
