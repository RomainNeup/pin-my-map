<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import Map from '$lib/components/Map.svelte';
	import Title from '$lib/components/Title.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<div class="flex min-h-full flex-col space-y-4">
	<div class="flex items-center justify-between">
		<Title>My saved places</Title>
		<BackButton href="/" color="green" text="Map view" />
	</div>
	<div class="flex grow flex-col">
		{#if !!data.savedPlaces && data.savedPlaces.length === 0}
			<div class="flex min-h-full grow flex-col justify-center">
				<div class="flex h-full w-full flex-col items-center justify-center space-y-1">
					<p>No saved places found</p>
					<Button href="/place/search" color="green" outline prefix="🔍" size="small">
						Search for places
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				<Button href="/place/search" color="green" outline prefix="🔍" rounded="lg">
					Search for new places
				</Button>
				{#each data.savedPlaces as savedPlace}
					<a href={`/saved/${savedPlace.id}`}>
						<div class="flex items-center space-x-2 overflow-hidden rounded-lg border">
							<div class="h-16 w-16">
								<Map
									sources={[
										{
											key: savedPlace.place.name,
											points: [
												{
													id: savedPlace.place.id,
													position: [savedPlace.place.location.lng, savedPlace.place.location.lat]
												}
											]
										}
									]}
									lat={savedPlace.place.location.lat}
									lng={savedPlace.place.location.lng}
									zoom={14}
									controls={false}
								/>
							</div>
							<div class="my-2 grow">
								<b>{savedPlace.place.name}</b>
								<p>{savedPlace.place.description}</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
