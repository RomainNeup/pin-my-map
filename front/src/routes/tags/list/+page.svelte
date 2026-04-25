<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import Input from '$lib/components/Input.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import SkeletonCard from '$lib/components/ui/SkeletonCard.svelte';
	import { createTag, deleteTag, updateTag, type Tag } from '$lib/api/tag';
	import { addTag, removeTag, replaceTag, tags } from '$lib/stores/tags';
	import { confirm } from '$lib/stores/confirm';
	import { toast } from '$lib/stores/toast';
	import Check from 'lucide-svelte/icons/check';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Plus from 'lucide-svelte/icons/plus';
	import TagIcon from 'lucide-svelte/icons/tag';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import X from 'lucide-svelte/icons/x';

	let newName = $state('');
	let newEmoji = $state('');
	let creating = $state(false);

	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editEmoji = $state('');
	let saving = $state(false);
	let deletingId = $state<string | null>(null);

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name || creating) return;
		creating = true;
		try {
			const tag = await createTag({ name, emoji: newEmoji || '🏷️' });
			addTag(tag);
			newName = '';
			newEmoji = '';
			toast(`Tag "${tag.name}" created`, 'success');
		} catch (err) {
			console.error(err);
			toast('Failed to create tag', 'error');
		} finally {
			creating = false;
		}
	};

	const startEdit = (tag: Tag) => {
		editingId = tag.id;
		editName = tag.name;
		editEmoji = tag.emoji;
	};

	const cancelEdit = () => {
		editingId = null;
		editName = '';
		editEmoji = '';
	};

	const saveEdit = async (id: string) => {
		const name = editName.trim();
		if (!name || saving) return;
		saving = true;
		try {
			const updated = await updateTag(id, { name, emoji: editEmoji || '🏷️' });
			replaceTag(updated);
			toast(`Tag updated`, 'success');
			cancelEdit();
		} catch (err) {
			console.error(err);
			toast('Failed to update tag', 'error');
		} finally {
			saving = false;
		}
	};

	const handleDelete = async (tag: Tag) => {
		const ok = await confirm({
			title: `Delete "${tag.name}"?`,
			message:
				'This tag will be removed from every saved place it was attached to. This cannot be undone.',
			confirmLabel: 'Delete',
			tone: 'danger'
		});
		if (!ok) return;
		deletingId = tag.id;
		try {
			await deleteTag(tag.id);
			removeTag(tag.id);
			toast(`Tag "${tag.name}" deleted`, 'success');
		} catch (err) {
			console.error(err);
			toast('Failed to delete tag', 'error');
		} finally {
			deletingId = null;
		}
	};
</script>

{#snippet tagIcon()}<TagIcon class="h-6 w-6" />{/snippet}
{#snippet plusPrefix()}<Plus class="h-4 w-4" />{/snippet}
{#snippet checkIcon()}<Check />{/snippet}
{#snippet xIcon()}<X />{/snippet}
{#snippet pencilIcon()}<Pencil />{/snippet}
{#snippet trashIcon()}<Trash2 />{/snippet}

<div class="mx-auto w-full max-w-3xl px-4 py-4 md:py-6">
	<div class="mb-6 flex items-center justify-between gap-3">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">My tags</h1>
	</div>

	<section class="mb-6 rounded-xl border border-border bg-bg-elevated p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-medium text-fg-muted">Create a new tag</h2>
		<form
			class="flex items-center gap-2"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
		>
			<EmojiPicker bind:value={newEmoji} />
			<Input bind:value={newName} placeholder="Tag name" fullwidth required disabled={creating} />
			<Button
				type="submit"
				variant="solid"
				tone="accent"
				prefix={plusPrefix}
				loading={creating}
				disabled={!newName.trim() || creating}
			>
				Create
			</Button>
		</form>
	</section>

	{#if $tags === undefined}
		<div class="grid gap-3">
			{#each Array(4) as _u, i (i)}
				<SkeletonCard />
			{/each}
		</div>
	{:else if $tags.length === 0}
		<EmptyState
			title="No tags yet"
			description="Create your first tag above to start organising your saved places."
			icon={tagIcon}
		/>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each $tags as tag (tag.id)}
				<li
					class="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated p-3 shadow-sm"
				>
					{#if editingId === tag.id}
						<EmojiPicker bind:value={editEmoji} />
						<Input
							bind:value={editName}
							placeholder="Tag name"
							fullwidth
							required
							disabled={saving}
							onKeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									saveEdit(tag.id);
								} else if (e.key === 'Escape') {
									cancelEdit();
								}
							}}
						/>
						<IconButton
							label="Save"
							icon={checkIcon}
							tone="accent"
							variant="soft"
							onclick={() => saveEdit(tag.id)}
							disabled={saving || !editName.trim()}
						/>
						<IconButton label="Cancel" icon={xIcon} onclick={cancelEdit} disabled={saving} />
					{:else}
						<span class="text-2xl leading-none" aria-hidden="true">{tag.emoji || '🏷️'}</span>
						<span class="flex-1 truncate text-fg">{tag.name}</span>
						<IconButton label="Edit tag" icon={pencilIcon} onclick={() => startEdit(tag)} />
						<IconButton
							label="Delete tag"
							icon={trashIcon}
							tone="danger"
							onclick={() => handleDelete(tag)}
							disabled={deletingId === tag.id}
						/>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
