<script lang="ts">
	import { createPlace, type CreatePlaceRequest, type Place } from '$lib/api/place';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Title from '$lib/components/Title.svelte';

	let inputName = '';
	let inputAddress = '';
	let inputDescription = '';
	let inputLocation: {lat: number | null, lng: number | null} = { lat: null, lng: null };
	let inputImage: File | null = null;

	const handleSubmit = async (event: Event) => {
		event.preventDefault();

		if (!inputLocation.lat || !inputLocation.lng) {
			return;
		}

		const place: CreatePlaceRequest = {
			name: inputName,
			address: inputAddress,
			description: inputDescription,
			location: {
				lat: inputLocation.lat,
				lng: inputLocation.lng
			}
		}
		// if (inputImage) {
		// 	formData.append('image', inputImage);
		// }
		createPlace(place)
	};
</script>

<div class="flex min-h-full flex-col space-y-4">
	<Title>Create a new place</Title>
	<form class="flex grow flex-col gap-2" on:submit={handleSubmit}>
		<Input bind:value={inputName} placeholder="Name" rounded="lg" fullwidth />
		<Input bind:value={inputAddress} placeholder="Address" rounded="lg" fullwidth />
		<Input bind:value={inputDescription} placeholder="Comment" type="textarea" rounded="lg" fullwidth />
		<div class="flex gap-2">
			<Input bind:value={inputLocation.lat} placeholder="Latitude" type="number" rounded="lg" fullwidth />
			<Input bind:value={inputLocation.lng} placeholder="Longitude" type="number" rounded="lg" fullwidth />
		</div>
		<Input bind:value={inputImage} placeholder="Image" type="file" rounded="lg" fullwidth />
		<Button type="submit" color="primary" rounded="lg" fullwidth>💾 Create</Button>
	</form>
</div>
