<script lang="ts">
	import type { Tag } from '$lib/api/tag';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';

	const MAX_VISIBLE = 5;

	interface Props {
		tags: Tag[];
		selected: string[];
		onChange: (selected: string[]) => void;
	}

	let { tags, selected = $bindable(), onChange }: Props = $props();

	let moreOpen = $state(false);
	let moreTrigger = $state<HTMLElement | null>(null);

	const toggle = (id: string) => {
		const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
		selected = next;
		onChange(next);
	};

	// Always show selected tags first, then fill up to MAX_VISIBLE with unselected
	const visibleTags = $derived.by(() => {
		const selectedTags = tags.filter((t) => selected.includes(t.id));
		const unselectedTags = tags.filter((t) => !selected.includes(t.id));
		const visible = [...selectedTags];
		for (const t of unselectedTags) {
			if (visible.length >= MAX_VISIBLE) break;
			visible.push(t);
		}
		return visible;
	});

	const collapsedTags = $derived(tags.filter((t) => !visibleTags.includes(t)));
	const collapsedSelected = $derived(collapsedTags.filter((t) => selected.includes(t.id)).length);
</script>

<div class="no-scrollbar pointer-events-auto flex items-center gap-1.5 overflow-x-auto">
	{#each visibleTags as tag (tag.id)}
		{#snippet prefix()}
			<span>{tag.emoji}</span>
		{/snippet}
		<Chip {prefix} selected={selected.includes(tag.id)} onclick={() => toggle(tag.id)}>
			{tag.name}
		</Chip>
	{/each}

	{#if collapsedTags.length > 0}
		<div bind:this={moreTrigger} class="shrink-0">
			<Chip
				onclick={() => (moreOpen = !moreOpen)}
				selected={collapsedSelected > 0}
			>
				+{collapsedTags.length} more{collapsedSelected > 0 ? ` (${collapsedSelected})` : ''}
			</Chip>
		</div>

		<Popover bind:open={moreOpen} anchor={moreTrigger} placement="bottom-start">
			<div class="flex max-h-64 min-w-[200px] flex-col gap-1 overflow-y-auto p-1">
				{#each collapsedTags as tag (tag.id)}
					{#snippet prefix()}
						<span>{tag.emoji}</span>
					{/snippet}
					<Chip
						{prefix}
						selected={selected.includes(tag.id)}
						onclick={() => toggle(tag.id)}
						class="w-full justify-start"
					>
						{tag.name}
					</Chip>
				{/each}
			</div>
		</Popover>
	{/if}
</div>
