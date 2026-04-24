<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		addCommentToSavedPlace,
		addRatingToSavedPlace,
		addTagToSavedPlace,
		deleteSavedPlace,
		removeTagFromSavedPlace,
		toggleDoneSavedPlace
	} from '$lib/api/savedPlace';
	import { createTag, type Tag } from '$lib/api/tag';
	import Map from '$lib/components/Map.svelte';
	import Select from '$lib/components/Select.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { confirm } from '$lib/stores/confirm';
	import { toast } from '$lib/stores/toast';
	import Check from 'lucide-svelte/icons/check';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { tick } from 'svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let comment = $state(data.savedPlace?.comment ?? '');
	let savedComment = $state(data.savedPlace?.comment ?? '');
	let rating = $state(data.savedPlace?.rating ?? 0);
	let editingComment = $state(false);
	let savedPlaceTags = $state<Tag[]>(data.savedPlace?.tags ?? []);
	let done = $state(!!data.savedPlace?.done);
	let menuOpen = $state(false);
	let commentRef: HTMLTextAreaElement | null = $state(null);

	const availableTagNames = $derived(
		data.tags.map((t) => t.name).filter((name) => !savedPlaceTags.find((t) => t.name === name))
	);

	const onTagsChange = (names: string[]) => {
		const tagsToAdd = data.tags.filter(
			(tag) => names.includes(tag.name) && !savedPlaceTags.find((t) => t.name === tag.name)
		);
		tagsToAdd.forEach(addTag);
	};

	const addTag = async (tag: Tag) => {
		await addTagToSavedPlace(data.savedPlace.id, tag.id);
		savedPlaceTags = [...savedPlaceTags, tag];
	};

	const removeTag = async (tag: Tag) => {
		await removeTagFromSavedPlace(data.savedPlace.id, tag.id);
		savedPlaceTags = savedPlaceTags.filter((t) => t.id !== tag.id);
	};

	const enterCommentEdit = async () => {
		editingComment = true;
		await tick();
		commentRef?.focus();
	};

	const saveComment = async () => {
		if (comment === savedComment) {
			editingComment = false;
			return;
		}
		await addCommentToSavedPlace(data.savedPlace.id, comment);
		savedComment = comment;
		editingComment = false;
		toast('Comment saved', 'success');
	};

	const handleCommentKey = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			saveComment();
		} else if (e.key === 'Escape') {
			comment = savedComment;
			editingComment = false;
		}
	};

	const handleCommentBlur = () => {
		if (comment !== savedComment) {
			saveComment();
		} else {
			editingComment = false;
		}
	};

	const toggleDone = async () => {
		done = !done;
		await toggleDoneSavedPlace(data.savedPlace.id);
	};

	const handleRating = async (value: number) => {
		rating = value;
		await addRatingToSavedPlace(data.savedPlace.id, value);
		toast('Rating saved', 'success');
	};

	const handleDelete = async () => {
		menuOpen = false;
		const ok = await confirm({
			title: 'Delete saved place?',
			message: 'All tags, comments, and rating will be lost.',
			confirmLabel: 'Delete',
			tone: 'danger'
		});
		if (!ok) return;
		await deleteSavedPlace(data.savedPlace.id);
		toast('Saved place deleted', 'success');
		goto('/saved/list');
	};

	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) {
			history.back();
		} else {
			goto('/saved/list');
		}
	};
</script>

{#snippet backIcon()}<ChevronLeft class="h-5 w-5" />{/snippet}
{#snippet menuIcon()}<MoreHorizontal class="h-5 w-5" />{/snippet}
{#snippet doneChipPrefix()}<Check class="h-3 w-3" />{/snippet}

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<div class="mb-4 flex items-center justify-between">
		<IconButton label="Go back" variant="ghost" tone="neutral" onclick={goBack} icon={backIcon} />

		<div class="relative">
			<IconButton
				label="More options"
				variant="ghost"
				tone="neutral"
				onclick={() => (menuOpen = !menuOpen)}
				icon={menuIcon}
			/>
			<Popover bind:open={menuOpen} placement="bottom-end">
				<button
					type="button"
					class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger-soft"
					onclick={handleDelete}
					role="menuitem"
				>
					<Trash2 class="h-4 w-4" />
					<span>Delete saved place</span>
				</button>
			</Popover>
		</div>
	</div>

	{#if data.savedPlace?.place}
		<div class="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
			<div class="space-y-4">
				<div class="h-48 overflow-hidden rounded-xl md:h-80">
					<Map
						sources={[
							{
								key: data.savedPlace.place.name,
								points: [
									{
										id: data.savedPlace.place.id,
										position: [
											data.savedPlace.place.location.lng,
											data.savedPlace.place.location.lat
										]
									}
								]
							}
						]}
						lat={data.savedPlace.place.location.lat}
						lng={data.savedPlace.place.location.lng}
						zoom={14}
					/>
				</div>

				<div class="space-y-2">
					<h1 class="text-2xl font-semibold leading-7 text-fg md:text-[28px]">
						{data.savedPlace.place.name}
					</h1>
					{#if data.savedPlace.place.description}
						<p class="text-fg-muted">{data.savedPlace.place.description}</p>
					{/if}
					{#if data.savedPlace.place.address}
						<div class="flex items-start gap-2 text-sm text-fg-muted">
							<MapPinIcon class="mt-0.5 h-4 w-4 shrink-0" />
							<span>{data.savedPlace.place.address}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-6">
				<!-- Done toggle -->
				<div
					class="flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-4"
				>
					{#if done}
						<Chip prefix={doneChipPrefix} size="sm">Done</Chip>
					{:else}
						<Chip size="sm">To try</Chip>
					{/if}
					<Toggle value={done} onToggle={toggleDone} size="md" />
				</div>

				<!-- Tags -->
				<div class="space-y-2">
					<h3 class="text-sm font-medium text-fg">Tags</h3>
					<div class="flex flex-wrap items-center gap-2">
						{#each savedPlaceTags as tag (tag.id)}
							<Chip prefix={tag.emoji} size="sm" onRemove={() => removeTag(tag)}>
								{tag.name}
							</Chip>
						{/each}
						<Select
							size="sm"
							options={availableTagNames}
							placeholder="+ Add tag"
							onChange={onTagsChange}
							onAddOption={(tagName, tagEmoji) => createTag({ name: tagName, emoji: tagEmoji })}
							newOptionPlaceholder="Add new tag (ENTER)"
						/>
					</div>
				</div>

				<!-- Rating -->
				<div class="space-y-2">
					<h3 class="text-sm font-medium text-fg">My rating</h3>
					<StarRating {rating} onChange={handleRating} />
				</div>

				<!-- Comment -->
				<div class="space-y-2">
					<h3 class="text-sm font-medium text-fg">Comment</h3>
					{#if editingComment}
						<textarea
							bind:value={comment}
							bind:this={commentRef}
							placeholder="Add a comment..."
							onkeydown={handleCommentKey}
							onblur={handleCommentBlur}
							rows="3"
							class="block min-h-[80px] w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
						></textarea>
						<p class="text-xs text-fg-subtle">Press Cmd/Ctrl+Enter to save · Esc to cancel</p>
					{:else}
						<button
							type="button"
							onclick={enterCommentEdit}
							class="block w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-left text-sm transition-colors hover:bg-bg-muted"
						>
							{#if savedComment}
								<span class="whitespace-pre-wrap text-fg">{savedComment}</span>
							{:else}
								<span class="text-fg-subtle">Add a comment...</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
