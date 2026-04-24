<script lang="ts">
	import type { Tag } from '$lib/api/tag';
	import Chip from '$lib/components/ui/Chip.svelte';

	interface Props {
		tags: Tag[];
		selected: string[];
		onChange: (selected: string[]) => void;
	}

	let { tags, selected = $bindable(), onChange }: Props = $props();

	const toggle = (id: string) => {
		const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
		selected = next;
		onChange(next);
	};
</script>

<div class="no-scrollbar pointer-events-auto flex items-center gap-1.5 overflow-x-auto">
	{#each tags as tag (tag.id)}
		{#snippet prefix()}
			<span>{tag.emoji}</span>
		{/snippet}
		<Chip {prefix} selected={selected.includes(tag.id)} onclick={() => toggle(tag.id)}>
			{tag.name}
		</Chip>
	{/each}
</div>
