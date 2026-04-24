<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { clickOutside } from '$lib/utils/clickOutside';

	interface PopoverProps {
		open: boolean;
		onClose?: () => void;
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		children: Snippet;
		class?: string;
	}

	let {
		open = $bindable(),
		onClose,
		placement = 'bottom-end',
		children,
		class: className
	}: PopoverProps = $props();

	const posCls = $derived(
		{
			'bottom-end': 'top-full right-0 mt-2',
			'bottom-start': 'top-full left-0 mt-2',
			'top-end': 'bottom-full right-0 mb-2',
			'top-start': 'bottom-full left-0 mb-2'
		}[placement]
	);

	const flyY = placement.startsWith('top') ? 4 : -4;

	const close = () => {
		open = false;
		onClose?.();
	};

	const handleKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && open) close();
	};
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		class="absolute z-popover min-w-[180px] rounded-lg border border-border bg-bg-elevated p-1 shadow-lg {posCls} {className ??
			''}"
		use:clickOutside={close}
		transition:fly={{ y: flyY, duration: 120 }}
		role="menu"
	>
		{@render children()}
	</div>
{/if}
