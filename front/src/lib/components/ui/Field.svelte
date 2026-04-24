<script lang="ts">
	import type { Snippet } from 'svelte';
	import FormLabel from './FormLabel.svelte';

	interface FieldProps {
		label?: string;
		hint?: string;
		error?: string;
		required?: boolean;
		id?: string;
		children: Snippet<[{ id: string }]>;
	}

	const {
		label,
		hint,
		error,
		required,
		id = `field-${Math.random().toString(36).slice(2, 9)}`,
		children
	}: FieldProps = $props();
</script>

<div class="space-y-1.5">
	{#if label}
		<FormLabel for={id} {required}>{label}</FormLabel>
	{/if}
	{@render children({ id })}
	{#if error}
		<p class="text-xs text-danger" role="alert">{error}</p>
	{:else if hint}
		<p class="text-xs text-fg-muted">{hint}</p>
	{/if}
</div>
