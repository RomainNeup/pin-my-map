<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-screen p-4">
	<div class="flex h-full w-full justify-center">
		<div class="max-w-md w-full">
			{@render children()}
		</div>
	</div>
</div>
