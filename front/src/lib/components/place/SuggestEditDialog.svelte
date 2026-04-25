<script lang="ts">
	import type { Place } from '$lib/api/place';
	import {
		createSuggestion,
		type SuggestionChanges,
		type CreateSuggestionRequest
	} from '$lib/api/suggestion';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import { toast } from '$lib/stores/toast';

	interface Props {
		open: boolean;
		place: Place;
		onSubmitted?: () => void;
	}

	let { open = $bindable(), place, onSubmitted }: Props = $props();

	let name = $state(place.name);
	let description = $state(place.description ?? '');
	let address = $state(place.address ?? '');
	let image = $state(place.image ?? '');
	let lat = $state<number | null>(place.location.lat);
	let lng = $state<number | null>(place.location.lng);
	let note = $state('');
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
			note = '';
			error = '';
		}
	});

	const buildChanges = (): SuggestionChanges => {
		const c: SuggestionChanges = {};
		if (name !== place.name) c.name = name;
		if (description !== (place.description ?? '')) c.description = description;
		if (address !== (place.address ?? '')) c.address = address;
		if (image !== (place.image ?? '')) c.image = image;
		if (
			typeof lat === 'number' &&
			typeof lng === 'number' &&
			(lat !== place.location.lat || lng !== place.location.lng)
		) {
			c.location = { lat, lng };
		}
		return c;
	};

	const submit = async (event: Event) => {
		event.preventDefault();
		error = '';
		const changes = buildChanges();
		if (Object.keys(changes).length === 0) {
			error = 'Change at least one field before submitting.';
			return;
		}
		submitting = true;
		try {
			const req: CreateSuggestionRequest = {
				placeId: place.id,
				changes,
				note: note.trim() || undefined
			};
			await createSuggestion(req);
			toast('Suggestion submitted for review', 'success');
			open = false;
			onSubmitted?.();
		} catch {
			// interceptor toasts server error
		} finally {
			submitting = false;
		}
	};
</script>

<Dialog
	bind:open
	title="Suggest an edit"
	description="Admins will review your proposed changes before they go live."
>
	<form class="space-y-4" onsubmit={submit}>
		<Field label="Name">
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
		<Field label="Note to reviewers" hint="Optional. Explain why this change is needed.">
			{#snippet children({ id })}
				<Input {id} type="textarea" bind:value={note} />
			{/snippet}
		</Field>
		{#if error}
			<p class="text-xs text-danger" role="alert">{error}</p>
		{/if}
		<div class="flex items-center justify-end gap-2 pt-1">
			<Button variant="ghost" tone="neutral" onclick={() => (open = false)}>Cancel</Button>
			<Button type="submit" loading={submitting}>Submit</Button>
		</div>
	</form>
</Dialog>
