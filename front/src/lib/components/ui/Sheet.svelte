<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import X from 'lucide-svelte/icons/x';
	import IconButton from './IconButton.svelte';
	import { focusTrap } from '$lib/utils/focusTrap';

	type Snap = 'collapsed' | 'half' | 'full';

	interface SheetProps {
		open: boolean;
		snap?: Snap;
		title?: string;
		onClose?: () => void;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
	}

	let {
		open = $bindable(),
		snap = $bindable('half'),
		title,
		onClose,
		children,
		header,
		footer
	}: SheetProps = $props();

	let isDesktop = $state(false);
	let dragState = $state<{ startY: number; startSnap: Snap; delta: number } | null>(null);
	let sheetEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mql = window.matchMedia('(min-width: 768px)');
		isDesktop = mql.matches;
		const fn = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mql.addEventListener('change', fn);
		return () => mql.removeEventListener('change', fn);
	});

	$effect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		const shouldLock = isDesktop || snap === 'full';
		if (shouldLock) document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	const close = () => {
		open = false;
		onClose?.();
	};

	const handleKey = (e: KeyboardEvent) => {
		if (!open) return;
		if (e.key === 'Escape') {
			if (!isDesktop && snap === 'full') snap = 'half';
			else close();
		}
	};

	// Mobile snap heights — measured from the bottom of the viewport
	const snapHeight: Record<Snap, string> = {
		collapsed: '120px',
		half: '50dvh',
		full: '90dvh'
	};

	const onHandleDown = (e: PointerEvent) => {
		if (isDesktop) return;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		dragState = { startY: e.clientY, startSnap: snap, delta: 0 };
	};

	const onHandleMove = (e: PointerEvent) => {
		if (!dragState) return;
		dragState = { ...dragState, delta: e.clientY - dragState.startY };
	};

	const onHandleUp = () => {
		if (!dragState) return;
		const { delta } = dragState;
		if (delta < -60) {
			snap = snap === 'collapsed' ? 'half' : 'full';
		} else if (delta > 60) {
			if (snap === 'full') snap = 'half';
			else if (snap === 'half') snap = 'collapsed';
			else close();
		}
		dragState = null;
	};

	const mobileStyle = $derived.by(() => {
		if (isDesktop) return '';
		const h = snapHeight[snap];
		const base = `height: ${h};`;
		if (!dragState) return base + ' transition: transform 200ms ease-out;';
		const dy = Math.max(0, dragState.delta);
		return base + ` transform: translateY(${dy}px);`;
	});
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	{#if isDesktop}
		<div class="fixed inset-0 z-sheet" aria-modal="true" role="dialog">
			<div
				class="absolute inset-0 bg-black/30"
				onclick={close}
				onkeydown={() => {}}
				role="presentation"
				transition:fade={{ duration: 150 }}
			></div>
			<div
				bind:this={sheetEl}
				use:focusTrap
				class="absolute right-0 top-0 flex h-dvh w-full max-w-[420px] flex-col border-l border-border bg-bg-elevated shadow-xl"
				transition:fly={{ x: 420, duration: 220 }}
			>
				<header class="flex items-center justify-between border-b border-border px-4 py-3">
					<div class="min-w-0 flex-1">
						{#if header}
							{@render header()}
						{:else if title}
							<h2 class="truncate text-base font-semibold">{title}</h2>
						{/if}
					</div>
					{#snippet xIcon()}
						<X />
					{/snippet}
					<IconButton icon={xIcon} label="Close" size="sm" onclick={close} />
				</header>
				<div class="flex-1 overflow-y-auto p-4">{@render children()}</div>
				{#if footer}
					<footer class="border-t border-border p-3">{@render footer()}</footer>
				{/if}
			</div>
		</div>
	{:else}
		<div class="fixed inset-0 z-sheet" aria-modal="true" role="dialog">
			{#if snap === 'full'}
				<div
					class="absolute inset-0 bg-black/30"
					onclick={close}
					onkeydown={() => {}}
					role="presentation"
					transition:fade={{ duration: 150 }}
				></div>
			{/if}
			<div
				bind:this={sheetEl}
				use:focusTrap
				class="absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border bg-bg-elevated shadow-xl"
				style={mobileStyle}
				transition:fly={{ y: 300, duration: 220 }}
			>
				<div
					class="flex touch-none items-center justify-center py-2"
					onpointerdown={onHandleDown}
					onpointermove={onHandleMove}
					onpointerup={onHandleUp}
					onpointercancel={onHandleUp}
					role="separator"
					aria-orientation="horizontal"
				>
					<span class="h-1.5 w-10 rounded-full bg-border-strong"></span>
				</div>
				{#if header || title}
					<header class="flex items-center justify-between gap-2 px-4 pb-2">
						<div class="min-w-0 flex-1">
							{#if header}
								{@render header()}
							{:else if title}
								<h2 class="truncate text-base font-semibold">{title}</h2>
							{/if}
						</div>
					</header>
				{/if}
				<div class="flex-1 overflow-y-auto px-4 pb-4">{@render children()}</div>
				{#if footer}
					<footer
						class="border-t border-border p-3"
						style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));"
					>
						{@render footer()}
					</footer>
				{/if}
			</div>
		</div>
	{/if}
{/if}
