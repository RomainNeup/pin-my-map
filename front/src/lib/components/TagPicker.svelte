<script lang="ts">
	import type { Tag } from '$lib/api/tag';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Plus from 'lucide-svelte/icons/plus';
	import { fly } from 'svelte/transition';
	import { tick } from 'svelte';
	import Chip from './ui/Chip.svelte';
	import EmojiPicker from './EmojiPicker.svelte';

	interface Props {
		selected: Tag[];
		available: Tag[];
		onAdd: (tag: Tag) => void | Promise<void>;
		onRemove: (tag: Tag) => void | Promise<void>;
		onCreate: (name: string, emoji: string) => Promise<Tag>;
	}

	let { selected, available, onAdd, onRemove, onCreate }: Props = $props();

	let open = $state(false);
	let query = $state('');
	let newEmoji = $state('');
	let creating = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);

	const filtered = $derived(
		query.trim()
			? available.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
			: available
	);

	const canCreate = $derived(
		query.trim().length > 0 &&
			!available.some((t) => t.name.toLowerCase() === query.trim().toLowerCase()) &&
			!selected.some((t) => t.name.toLowerCase() === query.trim().toLowerCase())
	);

	const openPopover = async () => {
		open = true;
		await tick();
		inputRef?.focus();
	};

	const handleCreate = async () => {
		if (!canCreate || creating) return;
		creating = true;
		try {
			const tag = await onCreate(query.trim(), newEmoji || '🏷️');
			await onAdd(tag);
			query = '';
			newEmoji = '';
			await tick();
			inputRef?.focus();
		} finally {
			creating = false;
		}
	};

	const handleKey = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (filtered.length === 1) {
				onAdd(filtered[0]);
				query = '';
			} else if (canCreate) {
				handleCreate();
			}
		} else if (e.key === 'Escape') {
			open = false;
		}
	};
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each selected as tag (tag.id)}
		<Chip prefix={tag.emoji} size="sm" onRemove={() => onRemove(tag)}>
			{tag.name}
		</Chip>
	{/each}

	<div class="relative" use:clickOutside={() => (open = false)}>
		<button
			type="button"
			class="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-2.5 text-xs text-fg-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-soft-fg"
			onclick={openPopover}
			aria-expanded={open}
		>
			<Plus class="h-3.5 w-3.5" />
			<span>Add tag</span>
		</button>

		{#if open}
			<div
				transition:fly={{ y: -4, duration: 120 }}
				class="absolute left-0 top-full z-popover mt-2 w-64 rounded-lg border border-border bg-bg-elevated p-2 shadow-lg"
				role="dialog"
			>
				<input
					bind:this={inputRef}
					bind:value={query}
					onkeydown={handleKey}
					type="text"
					placeholder="Search or create tag..."
					class="mb-2 block h-9 w-full rounded-md border border-border bg-bg-elevated px-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
				/>

				<div class="max-h-56 overflow-y-auto">
					{#if filtered.length > 0}
						<div class="flex flex-wrap gap-1.5 p-1">
							{#each filtered as tag (tag.id)}
								<Chip
									size="sm"
									prefix={tag.emoji}
									onclick={() => {
										onAdd(tag);
										query = '';
										inputRef?.focus();
									}}
								>
									{tag.name}
								</Chip>
							{/each}
						</div>
					{:else if !canCreate}
						<p class="px-2 py-3 text-center text-xs text-fg-muted">
							{available.length === 0 ? 'No tags yet — create one below.' : 'No matching tags.'}
						</p>
					{/if}
				</div>

				{#if canCreate}
					<div class="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
						<EmojiPicker bind:value={newEmoji} />
						<button
							type="button"
							class="flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-fg hover:bg-bg-muted disabled:cursor-not-allowed disabled:opacity-60"
							onclick={handleCreate}
							disabled={creating}
						>
							<Plus class="h-3.5 w-3.5 text-fg-muted" />
							<span class="truncate">
								Create <span class="font-medium">"{query.trim()}"</span>
							</span>
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
