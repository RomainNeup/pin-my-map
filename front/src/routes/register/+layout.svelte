<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-screen justify-center">
	<div class="flex h-full w-full items-center justify-center">
		<div class="max-w-md w-full">
			{@render children()}
		</div>
	</div>
</div>
