<script lang="ts">
	import type { Snippet } from 'svelte';

	interface EmptyStateProps {
		title: string;
		description?: string;
		icon?: Snippet;
		action?: Snippet;
	}

	const { title, description, icon, action }: EmptyStateProps = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
	{#if icon}
		<div
			class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
		>
			{@render icon()}
		</div>
	{/if}
	<h3 class="text-lg font-semibold text-fg">{title}</h3>
	{#if description}
		<p class="max-w-sm text-sm text-fg-muted">{description}</p>
	{/if}
	{#if action}
		<div class="pt-2">{@render action()}</div>
	{/if}
</div>
