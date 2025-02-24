<script lang="ts">
	import { addTagToSavedPlace, removeTagFromSavedPlace } from '$lib/api/savedPlace';
	import type { Tag } from '$lib/api/tag';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Label from '$lib/components/Label.svelte';
	import Map from '$lib/components/Map.svelte';
	import Select from '$lib/components/Select.svelte';
	import Title from '$lib/components/Title.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
	let comment = $state('');
	let savedPlaceTags = $state(data.savedPlace?.tags);

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
</script>

<div class="space-y-2">
	{#if data.savedPlace.place}
		<div class="flex items-center">
			<div class="grow">
				<Title>{data.savedPlace.place.name}</Title>
				<p>{data.savedPlace.place.description}</p>
			</div>
			<div>
				<Toggle />
			</div>
		</div>
		<div class="h-32 overflow-hidden rounded-lg">
			<Map
				sources={[
					{
						key: data.savedPlace.place.name,
						points: [
							{
								id: data.savedPlace.place.id,
								position: [data.savedPlace.place.location.lng, data.savedPlace.place.location.lat]
							}
						]
					}
				]}
				lat={data.savedPlace.place.location.lat}
				lng={data.savedPlace.place.location.lng}
				zoom={14}
			/>
		</div>
		<div>
			{data.savedPlace.place?.address}
		</div>
		<div class="">
			{#if data.savedPlace.done}
				<Label size="small" color="green" prefix="✅">Done</Label>
			{:else}
				<Label size="small" color="orange" prefix="🤔">To try</Label>
			{/if}
			{#each savedPlaceTags as tag}
				<button onclick={() => removeTag(tag)} class="inline-block mx-1">
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
				placeholder="Add label"
				onChange={onTagsChange}
			/>
		</div>
		<div>
			{#if data.savedPlace.comment || comment}
				<p>{data.savedPlace.comment || comment}</p>
			{:else}
				<Input bind:value={comment} placeholder="Comment" type="textarea" />
			{/if}
		</div>
	{/if}
</div>
