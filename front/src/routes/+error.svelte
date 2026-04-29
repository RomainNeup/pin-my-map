<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	function retry() {
		if (typeof window !== 'undefined') window.location.reload();
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
	<h1 class="text-4xl font-bold">{$page.status} — Something went wrong</h1>
	<p class="max-w-md text-gray-600 dark:text-gray-300">
		{$page.error?.message ?? 'An unexpected error occurred. Please try again.'}
	</p>
	<div class="mt-2 flex gap-3">
		<button
			type="button"
			class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			on:click={retry}
		>
			Retry
		</button>
		<button
			type="button"
			class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
			on:click={() => goto('/')}
		>
			Back to home
		</button>
	</div>
</div>
