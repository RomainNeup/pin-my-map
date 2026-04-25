<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from 'lucide-svelte/icons/x';
	import IconButton from './IconButton.svelte';

	interface DialogProps {
		open: boolean;
		title?: string;
		description?: string;
		onClose?: () => void;
		children: Snippet;
		footer?: Snippet;
		closable?: boolean;
	}

	let {
		open = $bindable(),
		title,
		description,
		onClose,
		children,
		footer,
		closable = true
	}: DialogProps = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		if (!open && dialogEl.open) dialogEl.close();
	});

	const close = () => {
		open = false;
		onClose?.();
	};
</script>

{#snippet xIcon()}
	<X />
{/snippet}

<dialog
	bind:this={dialogEl}
	class="w-full max-w-md rounded-xl border border-border bg-bg-elevated p-0 text-fg shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
	oncancel={(e) => {
		e.preventDefault();
		if (closable) close();
	}}
	onclose={close}
>
	{#if open}
		<div class="flex items-start justify-between gap-3 p-5 pb-3">
			<div class="flex-1">
				{#if title}
					<h2 class="text-lg font-semibold">{title}</h2>
				{/if}
				{#if description}
					<p class="mt-1 text-sm text-fg-muted">{description}</p>
				{/if}
			</div>
			{#if closable}
				<IconButton icon={xIcon} label="Close" size="sm" onclick={close} />
			{/if}
		</div>
		<div class="px-5 pb-4">{@render children()}</div>
		{#if footer}
			<div class="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
				{@render footer()}
			</div>
		{/if}
	{/if}
</dialog>

<style>
	dialog[open] {
		animation: dialog-in 150ms ease-out;
	}
	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: translateY(4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
