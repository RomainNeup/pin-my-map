<script lang="ts">
	import type { Tag } from '$lib/api/tag';
	import X from 'lucide-svelte/icons/x';

	interface Props {
		tag: Tag;
		size?: 'sm' | 'md';
		onRemove?: () => void;
		onclick?: (e: MouseEvent) => void;
		selected?: boolean;
	}

	const DEFAULT_COLOR = '#cbd5e1';

	/** Compute a readable foreground colour (dark or white) from a hex background. */
	function getTextColor(hex: string): string {
		const r = parseInt(hex.slice(1, 3), 16) / 255;
		const g = parseInt(hex.slice(3, 5), 16) / 255;
		const b = parseInt(hex.slice(5, 7), 16) / 255;
		const toLinear = (c: number) =>
			c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
		return L > 0.179 ? '#1e293b' : '#ffffff';
	}

	const { tag, size = 'md', onRemove, onclick, selected = false }: Props = $props();

	const bgColor = $derived(tag.color ?? DEFAULT_COLOR);
	const fgColor = $derived(getTextColor(bgColor));
	const sizeCls = $derived(size === 'sm' ? 'h-6 px-2 text-xs gap-1' : 'h-7 px-3 text-sm gap-1.5');
	const baseCls = $derived(
		`inline-flex items-center rounded-full border whitespace-nowrap transition-colors duration-150 ${sizeCls}${onclick ? ' cursor-pointer' : ''}`
	);
	const inlineStyle = $derived(
		`background-color:${bgColor};color:${fgColor};border-color:${bgColor};` +
			(selected ? 'outline:2px solid currentColor;outline-offset:1px;' : '')
	);
</script>

{#if onclick}
	<button
		class={baseCls}
		style={inlineStyle}
		{onclick}
		aria-pressed={selected}
	>
		{#if tag.emoji}
			<span>{tag.emoji}</span>
		{/if}
		<span>{tag.name}</span>
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
	<span class={baseCls} style={inlineStyle}>
		{#if tag.emoji}
			<span>{tag.emoji}</span>
		{/if}
		<span>{tag.name}</span>
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
