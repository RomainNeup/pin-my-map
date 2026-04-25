<script lang="ts">
	import { type Place, type UpdatePlaceRequest, updatePlace } from '$lib/api/place';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import { toast } from '$lib/stores/toast';

	interface Props {
		open: boolean;
		place: Place;
		onUpdated?: (updated: Place) => void;
	}

	let { open = $bindable(), place, onUpdated }: Props = $props();

	let name = $state(place.name);
	let description = $state(place.description ?? '');
	let address = $state(place.address ?? '');
	let image = $state(place.image ?? '');
	let lat = $state<number | null>(place.location.lat);
	let lng = $state<number | null>(place.location.lng);
	let submitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) {
			name = place.name;
			description = place.description ?? '';
			address = place.address ?? '';
			image = place.image ?? '';
			lat = place.location.lat;
			lng = place.location.lng;
			error = '';
		}
	});

	const submit = async (event: Event) => {
		event.preventDefault();
		error = '';
		if (!name.trim()) {
			error = 'Name is required.';
			return;
		}
		if (typeof lat !== 'number' || typeof lng !== 'number') {
			error = 'Coordinates are required.';
			return;
		}
		submitting = true;
		try {
			const payload: UpdatePlaceRequest = {
				name: name.trim(),
				address: address.trim() || undefined,
				description: description.trim() || undefined,
				image: image.trim() || undefined,
				location: { lat, lng }
			};
			const updated = await updatePlace(place.id, payload);
			toast('Place updated', 'success');
			open = false;
			onUpdated?.(updated);
		} catch {
			// interceptor toasts server error
		} finally {
			submitting = false;
		}
	};
</script>

<Dialog bind:open title="Edit place" description="You are the creator of this place — changes apply immediately.">
	<form class="space-y-4" onsubmit={submit}>
		<Field label="Name" required>
			{#snippet children({ id })}
				<Input {id} bind:value={name} />
			{/snippet}
		</Field>
		<Field label="Description">
			{#snippet children({ id })}
				<Input {id} type="textarea" bind:value={description} />
			{/snippet}
		</Field>
		<Field label="Address">
			{#snippet children({ id })}
				<Input {id} bind:value={address} />
			{/snippet}
		</Field>
		<Field label="Image URL">
			{#snippet children({ id })}
				<Input {id} bind:value={image} />
			{/snippet}
		</Field>
		<div class="grid grid-cols-2 gap-3">
			<Field label="Latitude">
				{#snippet children({ id })}
					<Input {id} type="number" bind:value={lat} />
				{/snippet}
			</Field>
			<Field label="Longitude">
				{#snippet children({ id })}
					<Input {id} type="number" bind:value={lng} />
				{/snippet}
			</Field>
		</div>
		{#if error}
			<p class="text-xs text-danger" role="alert">{error}</p>
		{/if}
		<div class="flex items-center justify-end gap-2 pt-1">
			<Button variant="ghost" tone="neutral" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" loading={submitting}>Save changes</Button>
		</div>
	</form>
</Dialog>
