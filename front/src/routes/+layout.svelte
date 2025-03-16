<script lang="ts">
	import Error from '$lib/components/Error.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { accessToken } from '$lib/store/user';

	let { children } = $props();
	let token = $accessToken;

	onMount(() => {
		if (
			!token &&
			window.location.pathname !== '/login' &&
			window.location.pathname !== '/register'
		) {
			window.location.href = '/login';
			return;
		}
	});
</script>

<div class="flex min-h-screen justify-center">
	<div class="w-full">
		<div class="flex h-full flex-col">
			<div class="absolute bottom-0 right-0 z-20 flex flex-col space-y-2 p-4">
				<Error />
			</div>
			{@render children()}
		</div>
	</div>
</div>
