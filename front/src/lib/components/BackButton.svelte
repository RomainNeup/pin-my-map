<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Button from './Button.svelte';

	interface BackButtonProps {
		href?: string;
		text?: string;
		onClick?: () => void;
		class?: string;
	}

	const { href = '/', text = 'Back', onClick, class: className }: BackButtonProps = $props();
</script>

{#snippet label()}
	{text}
{/snippet}

{#snippet prefixIcon()}
	<ChevronLeft class="h-4 w-4" />
{/snippet}

<Button
	variant="ghost"
	tone="neutral"
	size="sm"
	{href}
	onclick={onClick}
	class={className}
	prefix={prefixIcon}
>
	{@render label()}
</Button>
