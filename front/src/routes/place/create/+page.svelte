<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { createPlace, type CreatePlaceRequest } from '$lib/api/place';
	import { createSavedPlace } from '$lib/api/savedPlace';
	import { toast } from '$lib/stores/toast';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Map from '$lib/components/Map.svelte';

	let name = $state('');
	let address = $state('');
	let description = $state('');
	let lat = $state<number | null>(null);
	let lng = $state<number | null>(null);
	let nameError = $state('');
	let locError = $state('');
	let submitting = $state(false);

	onMount(() => {
		const params = $page.url.searchParams;
		const qLat = params.get('lat');
		const qLng = params.get('lng');
		const qAddress = params.get('address');
		if (qLat) lat = parseFloat(qLat);
		if (qLng) lng = parseFloat(qLng);
		if (qAddress) address = qAddress;
	});

	const hasPin = $derived(lat != null && lng != null);

	const previewSource = $derived(
		hasPin
			? [
					{
						key: 'preview',
						points: [{ id: 'preview', position: [lng!, lat!] as [number, number] }]
					}
				]
			: []
	);

	const submit = async (event: Event) => {
		event.preventDefault();
		nameError = name.trim() ? '' : 'Name is required';
		locError = hasPin ? '' : 'Drop a pin on the map or enter coordinates';
		if (nameError || locError || submitting) return;

		submitting = true;
		try {
			const payload: CreatePlaceRequest = {
				name,
				address,
				description,
				location: { lat: lat!, lng: lng! }
			};
			const created = await createPlace(payload);
			await createSavedPlace(created.id);
			toast('Place created and saved', 'success');
			goto('/');
		} catch {
			// toasted by interceptor
		} finally {
			submitting = false;
		}
	};
</script>

<div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-semibold">Add a place</h1>
		<p class="text-sm text-fg-muted">
			{#if hasPin}
				A pin was dropped on the map — fill in the details below.
			{:else}
				<a class="text-accent underline-offset-2 hover:underline" href="/place/pick">
					Pick a location on the map
				</a>
				or enter coordinates manually below.
			{/if}
		</p>
	</header>

	{#if hasPin}
		<div class="h-48 overflow-hidden rounded-xl border border-border md:h-64">
			<Map lat={lat!} lng={lng!} zoom={14} sources={previewSource} controls={false} />
		</div>
		<p class="flex items-start gap-1.5 font-mono text-xs text-fg-muted">
			<MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0" />
			<span>{lat!.toFixed(5)}, {lng!.toFixed(5)}</span>
		</p>
	{/if}

	<form class="space-y-4" onsubmit={submit}>
		<Field label="Name" required error={nameError}>
			{#snippet children({ id })}
				<Input {id} placeholder="e.g. Café Central" bind:value={name} error={!!nameError} />
			{/snippet}
		</Field>
		<Field label="Address" hint="Auto-filled when you drop a pin — edit if needed.">
			{#snippet children({ id })}
				<Input {id} placeholder="Street, city, country" bind:value={address} />
			{/snippet}
		</Field>
		<Field label="Description" hint="Why you love it — optional.">
			{#snippet children({ id })}
				<Input {id} type="textarea" placeholder="Notes, vibes, tips…" bind:value={description} />
			{/snippet}
		</Field>

		{#if !hasPin}
			<div class="grid grid-cols-2 gap-3">
				<Field label="Latitude" error={locError}>
					{#snippet children({ id })}
						<Input {id} type="number" placeholder="48.8566" bind:value={lat} error={!!locError} />
					{/snippet}
				</Field>
				<Field label="Longitude">
					{#snippet children({ id })}
						<Input {id} type="number" placeholder="2.3522" bind:value={lng} />
					{/snippet}
				</Field>
			</div>
		{/if}

		<div
			class="bg-bg-elevated/80 sticky -mx-4 border-t border-border px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0"
			style="bottom: var(--tabbar-h);"
		>
			<div class="flex gap-2">
				<Button variant="ghost" tone="neutral" href="/" fullwidth>Cancel</Button>
				<Button type="submit" fullwidth loading={submitting}>Create</Button>
			</div>
		</div>
	</form>
</div>
