<script lang="ts">
	import { createSavedPlace, type IsSavedPlaceResponse } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import Map from '$lib/components/Map.svelte';
	import Title from '$lib/components/Title.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let saved: IsSavedPlaceResponse = $state(data.saved);

	const savePlace = async () => {
		await createSavedPlace(data.place.id);
	};
</script>

<div class="relative min-h-full space-y-2">
	{#if data.place}
		<div class="flex items-center">
			<div class="grow">
				<Title>{data.place.name}</Title>
				<p>{data.place.description}</p>
			</div>
		</div>
		<div class="h-32 overflow-hidden rounded-lg">
			<Map
				sources={[
					{
						key: data.place.name,
						points: [
							{
								id: data.place.id,
								position: [data.place.location.lng, data.place.location.lat]
							}
						]
					}
				]}
				lat={data.place.location.lat}
				lng={data.place.location.lng}
				zoom={14}
			/>
		</div>
		<div>
			{data.place?.address}
		</div>
		<div class="absolute bottom-0 w-full space-y-2">
			<Button rounded="lg" fullwidth outline>✏️ Suggest an edit</Button>
			{#if saved.isSaved}
				<Button
					rounded="lg"
					color="green"
					outline
					href={`/saved/${saved.id}`}
					prefix='👁️'
					fullwidth
				>
					View in my places
				</Button>
			{:else}
				<Button
					rounded="lg"
					color="green"
					onClick={savePlace}
					prefix='💾'
					fullwidth
				>
					Save to my places
				</Button>
			{/if}
		</div>
	{/if}
</div>
