<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	interface IconButtonProps {
		icon: Snippet;
		label: string;
		variant?: 'solid' | 'soft' | 'outline' | 'ghost';
		tone?: 'accent' | 'neutral' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
	}

	const {
		icon,
		label,
		variant = 'ghost',
		tone = 'neutral',
		size = 'md',
		disabled = false,
		href,
		onclick,
		type = 'button',
		class: className
	}: IconButtonProps = $props();

	const sizeCls = { sm: 'h-9 w-9', md: 'h-10 w-10', lg: 'h-11 w-11' };
	const iconSize = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-5 w-5' };

	const toneVariant = {
		'solid-accent': 'bg-accent text-accent-fg hover:bg-accent-hover',
		'solid-neutral': 'bg-fg text-bg hover:opacity-90',
		'solid-danger': 'bg-danger text-white hover:opacity-90',
		'soft-accent': 'bg-accent-soft text-accent-soft-fg',
		'soft-neutral': 'bg-bg-muted text-fg hover:bg-bg-inset',
		'soft-danger': 'bg-danger-soft text-danger',
		'outline-accent': 'border border-accent text-accent hover:bg-accent-soft',
		'outline-neutral': 'border border-border-strong text-fg hover:bg-bg-muted',
		'outline-danger': 'border border-danger text-danger hover:bg-danger-soft',
		'ghost-accent': 'text-accent hover:bg-accent-soft',
		'ghost-neutral': 'text-fg hover:bg-bg-muted',
		'ghost-danger': 'text-danger hover:bg-danger-soft'
	} as const;

	const key = `${variant}-${tone}` as keyof typeof toneVariant;

	const base = $derived(
		twMerge(
			'inline-flex items-center justify-center rounded-lg transition-colors duration-150',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
			sizeCls[size],
			toneVariant[key],
			disabled && 'cursor-not-allowed opacity-60',
			className
		)
	);
</script>

{#if href && !disabled}
	<a class={base} {href} aria-label={label} title={label}>
		<span class={iconSize[size]}>{@render icon()}</span>
	</a>
{:else}
	<button class={base} {type} {onclick} {disabled} aria-label={label} title={label}>
		<span class={iconSize[size]}>{@render icon()}</span>
	</button>
{/if}
