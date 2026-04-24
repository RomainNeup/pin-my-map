<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	interface FormLabelProps {
		for?: string;
		children: Snippet;
		required?: boolean;
		size?: 'sm' | 'md';
		class?: string;
	}

	const {
		for: htmlFor,
		children,
		required,
		size = 'md',
		class: className
	}: FormLabelProps = $props();

	const cls = twMerge(
		'block font-medium text-fg',
		size === 'sm' ? 'text-xs' : 'text-sm',
		required && 'after:ml-0.5 after:text-danger after:content-["*"]',
		className
	);
</script>

<label for={htmlFor} class={cls}>{@render children()}</label>
