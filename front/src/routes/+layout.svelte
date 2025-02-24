<script lang="ts">
	import Error from '$lib/components/Error.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-screen justify-center">
	<div class="w-full">
		<div class="flex h-full flex-col">
			<div class="absolute bottom-0 right-0 p-4 flex flex-col space-y-2">
				<Error />
			</div>
			{@render children()}
		</div>
	</div>
</div>
