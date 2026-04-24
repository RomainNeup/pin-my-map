<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	interface ButtonProps {
		variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
		tone?: 'accent' | 'neutral' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		disabled?: boolean;
		fullwidth?: boolean;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		prefix?: Snippet;
		suffix?: Snippet;
		class?: string;
		ariaLabel?: string;
	}

	const {
		variant = 'solid',
		tone = 'accent',
		size = 'md',
		loading = false,
		disabled = false,
		fullwidth = false,
		href,
		type = 'button',
		onclick,
		children,
		prefix,
		suffix,
		class: className,
		ariaLabel
	}: ButtonProps = $props();

	const sizeCls = {
		sm: 'h-9 px-3 text-sm gap-1.5',
		md: 'h-10 px-4 text-sm gap-2',
		lg: 'h-11 px-5 text-base gap-2'
	};

	const toneVariant = {
		'solid-accent': 'bg-accent text-accent-fg hover:bg-accent-hover',
		'solid-neutral': 'bg-fg text-bg hover:opacity-90',
		'solid-danger': 'bg-danger text-white hover:opacity-90',
		'soft-accent':
			'bg-accent-soft text-accent-soft-fg hover:brightness-95 dark:hover:brightness-110',
		'soft-neutral': 'bg-bg-muted text-fg hover:bg-bg-inset',
		'soft-danger': 'bg-danger-soft text-danger hover:brightness-95 dark:hover:brightness-110',
		'outline-accent': 'border border-accent text-accent hover:bg-accent-soft',
		'outline-neutral': 'border border-border-strong text-fg hover:bg-bg-muted',
		'outline-danger': 'border border-danger text-danger hover:bg-danger-soft',
		'ghost-accent': 'text-accent hover:bg-accent-soft',
		'ghost-neutral': 'text-fg hover:bg-bg-muted',
		'ghost-danger': 'text-danger hover:bg-danger-soft',
		'link-accent': 'text-accent hover:underline underline-offset-2 px-0',
		'link-neutral': 'text-fg hover:underline underline-offset-2 px-0',
		'link-danger': 'text-danger hover:underline underline-offset-2 px-0'
	} as const;

	const key = `${variant}-${tone}` as keyof typeof toneVariant;

	const base = $derived(
		twMerge(
			'relative inline-flex items-center justify-center rounded-lg font-medium',
			'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
			variant !== 'link' && 'shadow-sm',
			sizeCls[size],
			toneVariant[key],
			fullwidth && 'w-full',
			(loading || disabled) && 'cursor-not-allowed opacity-60',
			className
		)
	);

	const contentCls = $derived(twMerge('inline-flex items-center gap-2', loading && 'opacity-0'));
</script>

{#snippet inner()}
	{#if prefix}<span class={loading ? 'opacity-0' : ''}>{@render prefix()}</span>{/if}
	<span class={contentCls}>{@render children()}</span>
	{#if suffix}<span class={loading ? 'opacity-0' : ''}>{@render suffix()}</span>{/if}
	{#if loading}
		<span class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
				<path
					d="M22 12a10 10 0 0 0-10-10"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
				/>
			</svg>
		</span>
	{/if}
{/snippet}

{#if href && !disabled && !loading}
	<a class={base} {href} aria-label={ariaLabel}>{@render inner()}</a>
{:else}
	<button
		class={base}
		{type}
		{onclick}
		disabled={disabled || loading}
		aria-busy={loading}
		aria-label={ariaLabel}>{@render inner()}</button
	>
{/if}
