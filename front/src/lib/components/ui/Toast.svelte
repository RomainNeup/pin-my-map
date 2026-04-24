<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, dismissToast, type ToastKind } from '$lib/stores/toast';
	import CheckCircle from 'lucide-svelte/icons/check-circle-2';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Info from 'lucide-svelte/icons/info';
	import X from 'lucide-svelte/icons/x';

	const kindCls: Record<ToastKind, string> = {
		success: 'border-success/40 bg-bg-elevated',
		info: 'border-info/40 bg-bg-elevated',
		warning: 'border-warning/40 bg-bg-elevated',
		error: 'border-danger/40 bg-bg-elevated'
	};

	const iconColor: Record<ToastKind, string> = {
		success: 'text-success',
		info: 'text-info',
		warning: 'text-warning',
		error: 'text-danger'
	};
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-3 z-toast flex flex-col items-center gap-2 px-3 md:inset-x-auto md:right-4 md:top-4 md:items-end md:px-0"
>
	{#each $toasts as t (t.id)}
		<div
			class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 shadow-lg {kindCls[
				t.kind
			]}"
			role="status"
			transition:fly={{ y: -12, duration: 200 }}
		>
			<span class="mt-0.5 {iconColor[t.kind]}">
				{#if t.kind === 'success'}
					<CheckCircle class="h-5 w-5" />
				{:else if t.kind === 'error'}
					<AlertCircle class="h-5 w-5" />
				{:else if t.kind === 'warning'}
					<AlertTriangle class="h-5 w-5" />
				{:else}
					<Info class="h-5 w-5" />
				{/if}
			</span>
			<div class="flex-1 text-sm text-fg">{t.message}</div>
			{#if t.action}
				<button
					class="text-sm font-medium text-accent hover:underline"
					onclick={() => {
						t.action?.onClick();
						dismissToast(t.id);
					}}>{t.action.label}</button
				>
			{/if}
			<button
				class="text-fg-subtle hover:text-fg"
				aria-label="Dismiss"
				onclick={() => dismissToast(t.id)}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>
