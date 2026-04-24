<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	interface FabProps {
		icon: Snippet;
		label: string;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		position?: 'br' | 'bl';
		offset?: number;
		class?: string;
	}

	const {
		icon,
		label,
		href,
		onclick,
		position = 'br',
		offset = 0,
		class: className
	}: FabProps = $props();

	const posCls = position === 'br' ? 'right-4' : 'left-4';
	const style = `bottom: calc(1rem + ${offset}px + env(safe-area-inset-bottom, 0px));`;

	const base = twMerge(
		'absolute z-fab flex h-14 w-14 items-center justify-center rounded-full',
		'bg-accent text-accent-fg shadow-lg',
		'transition-transform duration-150 active:scale-95 hover:scale-105',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
		posCls,
		className
	);
</script>

{#if href}
	<a class={base} {href} {style} aria-label={label} title={label}>
		<span class="h-6 w-6">{@render icon()}</span>
	</a>
{:else}
	<button class={base} {style} {onclick} aria-label={label} title={label}>
		<span class="h-6 w-6">{@render icon()}</span>
	</button>
{/if}
