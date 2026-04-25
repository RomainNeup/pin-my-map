<script lang="ts">
	import type { Tag } from '$lib/api/tag';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Button from '$lib/components/Button.svelte';
	import X from 'lucide-svelte/icons/x';

	interface Props {
		tags: Tag[];
		selected: string[];
		counts?: Record<string, number>;
		onchange: (selected: string[]) => void;
	}

	let { tags, selected = $bindable([]), counts = {}, onchange }: Props = $props();

	function toggle(id: string) {
		const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
		selected = next;
		onchange(next);
	}

	function clearAll() {
		selected = [];
		onchange([]);
	}
</script>

{#snippet clearIcon()}<X class="h-3 w-3" />{/snippet}

<div class="flex items-center gap-2">
	<div class="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
		{#each tags as tag (tag.id)}
			{#snippet prefix()}
				<span>{tag.emoji}</span>
			{/snippet}
			<Chip {prefix} selected={selected.includes(tag.id)} onclick={() => toggle(tag.id)}>
				{tag.name}{counts[tag.id] ? ` (${counts[tag.id]})` : ''}
			</Chip>
		{/each}
	</div>
	{#if selected.length > 0}
		<Button variant="ghost" tone="neutral" size="sm" onclick={clearAll} prefix={clearIcon}>
			Clear
		</Button>
	{/if}
</div>
