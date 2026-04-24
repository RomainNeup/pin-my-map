<script lang="ts">
	let { children } = $props();
</script>

<div class="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-muted p-4">
	<div
		class="pointer-events-none absolute inset-0 opacity-60"
		style="background: radial-gradient(60% 60% at 50% 35%, var(--c-accent-soft) 0%, transparent 65%), radial-gradient(40% 40% at 80% 80%, var(--c-accent-soft) 0%, transparent 60%);"
	></div>
	<div class="relative w-full max-w-sm">
		{@render children()}
	</div>
</div>
