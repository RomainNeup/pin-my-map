<script lang="ts">
	import { searchPlaces, type Place } from '$lib/api/place';
	import BackButton from '$lib/components/BackButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Map from '$lib/components/Map.svelte';
	import Title from '$lib/components/Title.svelte';

	let search = '';
	let searchResults: Place[] | null = null;

	const handleSearch = () => {
		console.log(search);
		if (search.length < 3) {
			return;
		}
		searchPlaces(search).then((places) => {
			searchResults = places;
		});
	};
</script>

<div class="flex min-h-full flex-col space-y-4">
	<div class="flex items-center justify-between">
		<Title>Search</Title>
		<BackButton href="/" color="green" text="Back to map" />
	</div>
	<Input placeholder="Search" bind:value={search} onInput={handleSearch} rounded="lg" fullwidth />
	<div class="flex grow flex-col">
		{#if searchResults === null}
			<div class="flex min-h-full grow flex-col justify-center">
				<div class="flex h-full w-full flex-col items-center justify-center space-y-1">
					<p>Start typing to search</p>
					<small>3 characters minimum</small>
				</div>
			</div>
		{:else if searchResults.length === 0}
			<div class="flex min-h-full grow flex-col justify-center">
				<div class="flex h-full w-full flex-col items-center justify-center space-y-1">
					<p>No results found</p>
					<Button href="/place/create" color="green" outline prefix="➕" size="small">
						Add a new place
					</Button>
				</div>
			</div>
		{:else if searchResults.length > 0}
			<div class="space-y-2">
				{#each searchResults as place}
					<a href={`/place/${place.id}`}>
						<div class="flex items-center space-x-2 overflow-hidden rounded-lg border">
							<div class="h-16 w-16">
								<Map
									sources={[
										{
											key: place.name,
											points: [
												{
													id: place.id,
													position: [place.location.lng, place.location.lat]
												}
											]
										}
									]}
									lat={place.location.lat}
									lng={place.location.lng}
									zoom={14}
									controls={false}
								/>
							</div>
							<div class="my-2 grow">
								<b>{place.name}</b>
								<p>{place.description}</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
