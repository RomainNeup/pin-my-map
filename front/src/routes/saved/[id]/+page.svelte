<script lang="ts">
	import {
		addCommentToSavedPlace,
		addRatingToSavedPlace,
		addTagToSavedPlace,
		deleteSavedPlace,
		removeTagFromSavedPlace,
		toogleDoneSavedPlace
	} from '$lib/api/savedPlace';
	import type { Tag } from '$lib/api/tag';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Label from '$lib/components/Label.svelte';
	import Map from '$lib/components/Map.svelte';
	import Select from '$lib/components/Select.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import Title from '$lib/components/Title.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { setError } from '$lib/store/error';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let comment = $state(data.savedPlace?.comment);
	let rating = $state(data.savedPlace?.rating);
	let editingComment = $state(!data.savedPlace?.comment);
	let savedPlaceTags = $state(data.savedPlace?.tags);
	let done = $state(data.savedPlace?.done);

	const onTagsChange = (tags: string[]) => {
		const tagsToAdd = data.tags.filter(
			(tag) => tags.includes(tag.name) && !savedPlaceTags?.find((t) => t.name === tag.name)
		);
		if (tagsToAdd) {
			tagsToAdd.forEach(addTag);
		}
	};

	const addTag = (tag: Tag) => {
		addTagToSavedPlace(data.savedPlace.id, tag.id);
		savedPlaceTags?.push(tag);
	};

	const removeTag = (tag: Tag) => {
		removeTagFromSavedPlace(data.savedPlace.id, tag.id);
		savedPlaceTags = savedPlaceTags?.filter((t) => t.id !== tag.id);
	};

	const saveComment = () => {
		if (comment) {
			addCommentToSavedPlace(data.savedPlace.id, comment);
			data.savedPlace.comment = comment;
			editingComment = false;
		}
	};

	const toogleDone = () => {
		toogleDoneSavedPlace(data.savedPlace.id);
		done = !done;
	};

	const handleRating = (value: number) => {
		addRatingToSavedPlace(data.savedPlace.id, value);
		rating = value;
	};

	const handleDelete = async () => {
		if (
			confirm(
				'Are you sure you want to delete this saved place? All tags and comments will be lost.'
			)
		) {
			await deleteSavedPlace(data.savedPlace.id);
			window.location.href = '/';
		} else {
			setError('Could not delete saved place');
		}
	};
</script>

<div class="relative min-h-full space-y-6">
	{#if data.savedPlace.place}
		<div class="space-y-2">
			<div class="flex items-center">
				<div class="grow">
					<Title>{data.savedPlace.place.name}</Title>
					<p>{data.savedPlace.place.description}</p>
				</div>
				<div>
					<Toggle value={done} onChange={toogleDone} />
				</div>
			</div>
			<div>
				<div class="h-32 overflow-hidden rounded-lg">
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
				<p>{data.savedPlace.place?.address}</p>
			</div>
		</div>
		<div class="space-y-4">
			<div class="space-y-2">
				<div class="flex flex-wrap gap-1">
					{#if done}
						<Label size="small" color="green" prefix="✅">Done</Label>
					{:else}
						<Label size="small" color="orange" prefix="🤔">To try</Label>
					{/if}
					{#each savedPlaceTags as tag}
						<button onclick={() => removeTag(tag)} class="inline-block">
							<Label size="small" color="green" prefix={tag.emoji}>
								{tag.name}
							</Label>
						</button>
					{/each}
					<Select
						size="small"
						outline
						prefix="➕"
						options={data.tags
							.map((tag) => tag.name)
							.filter((name) => !savedPlaceTags?.find((tag) => tag.name === name))}
						placeholder="Add tag"
						onChange={onTagsChange}
					/>
				</div>
			</div>
			<div class="space-y-2">
				<h3 class="font-bold">My rating</h3>
				<StarRating onChange={handleRating} rating={data.savedPlace.rating} />
				{#if editingComment}
					<form class="flex flex-col space-y-2" onsubmit={saveComment}>
						<Input rounded="lg" bind:value={comment} placeholder="Comment" type="textarea" />
						<Button rounded="lg" type="submit" prefix="💾">Save comment</Button>
					</form>
				{:else}
					<button onclick={() => (editingComment = true)}>
						<p class="rounded-lg border px-4 py-2 text-left">
							{data.savedPlace.comment || comment}
						</p>
					</button>
				{/if}
			</div>
		</div>

		<div class="absolute bottom-0 w-full space-y-2">
			<Button onClick={handleDelete} rounded="lg" color="red" fullwidth outline
				>🗑️ Delete saved place</Button
			>
		</div>
	{/if}
</div>
