<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import X from 'lucide-svelte/icons/x';

	interface ChipProps {
		children: Snippet;
		prefix?: Snippet | string;
		selected?: boolean;
		onclick?: (e: MouseEvent) => void;
		onRemove?: () => void;
		size?: 'sm' | 'md';
		class?: string;
		disabled?: boolean;
	}

	const {
		children,
		prefix,
		selected = false,
		onclick,
		onRemove,
		size = 'md',
		class: className,
		disabled = false
	}: ChipProps = $props();

	const sizeCls = size === 'sm' ? 'h-6 px-2 text-xs gap-1' : 'h-7 px-3 text-sm gap-1.5';

	const base = $derived(
		twMerge(
			'inline-flex items-center rounded-full border whitespace-nowrap transition-colors duration-150',
			sizeCls,
			selected
				? 'bg-accent-soft text-accent-soft-fg border-accent'
				: 'bg-bg-muted text-fg border-border hover:bg-bg-inset',
			onclick && 'cursor-pointer',
			disabled && 'cursor-not-allowed opacity-60',
			className
		)
	);
</script>

{#if onclick}
	<button class={base} {onclick} {disabled} aria-pressed={selected}>
		{#if prefix}
			{#if typeof prefix === 'string'}
				<span>{prefix}</span>
			{:else}
				{@render prefix()}
			{/if}
		{/if}
		{@render children()}
		{#if onRemove}
			<span
				role="button"
				tabindex="-1"
				class="-mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
				onclick={(e) => {
					e.stopPropagation();
					onRemove();
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.stopPropagation();
						onRemove();
					}
				}}
				aria-label="Remove"
			>
				<X class="h-3 w-3" />
			</span>
		{/if}
	</button>
{:else}
	<span class={base}>
		{#if prefix}
			{#if typeof prefix === 'string'}
				<span>{prefix}</span>
			{:else}
				{@render prefix()}
			{/if}
		{/if}
		{@render children()}
		{#if onRemove}
			<button
				type="button"
				class="-mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
				onclick={onRemove}
				aria-label="Remove"
			>
				<X class="h-3 w-3" />
			</button>
		{/if}
	</span>
{/if}
