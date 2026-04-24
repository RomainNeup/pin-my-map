<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/clickOutside';
	import { portal } from '$lib/utils/portal';

	interface PopoverProps {
		open: boolean;
		anchor?: HTMLElement | null;
		onClose?: () => void;
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		children: Snippet;
		class?: string;
	}

	let {
		open = $bindable(),
		anchor = null,
		onClose,
		placement = 'bottom-end',
		children,
		class: className
	}: PopoverProps = $props();

	const flyY = placement.startsWith('top') ? 4 : -4;

	let coords = $state<{ top?: number; bottom?: number; left?: number; right?: number }>({});

	const updateCoords = () => {
		if (!anchor) return;
		const r = anchor.getBoundingClientRect();
		const gap = 8;
		const next: typeof coords = {};
		if (placement.startsWith('top')) next.bottom = window.innerHeight - r.top + gap;
		else next.top = r.bottom + gap;
		if (placement.endsWith('end')) next.right = window.innerWidth - r.right;
		else next.left = r.left;
		coords = next;
	};

	$effect(() => {
		if (open && anchor) {
			updateCoords();
			const handler = () => updateCoords();
			window.addEventListener('resize', handler);
			window.addEventListener('scroll', handler, true);
			return () => {
				window.removeEventListener('resize', handler);
				window.removeEventListener('scroll', handler, true);
			};
		}
	});

	const close = () => {
		open = false;
		onClose?.();
	};

	const handleKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && open) close();
	};

	const style = $derived(
		[
			coords.top !== undefined ? `top:${coords.top}px` : '',
			coords.bottom !== undefined ? `bottom:${coords.bottom}px` : '',
			coords.left !== undefined ? `left:${coords.left}px` : '',
			coords.right !== undefined ? `right:${coords.right}px` : ''
		]
			.filter(Boolean)
			.join(';')
	);
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		use:portal
		class="fixed z-popover min-w-[180px] rounded-lg border border-border bg-bg-elevated p-1 shadow-lg {className ??
			''}"
		{style}
		use:clickOutside={{ onOutside: close, ignore: anchor }}
		transition:fly={{ y: flyY, duration: 120 }}
		role="menu"
	>
		{@render children()}
	</div>
{/if}
