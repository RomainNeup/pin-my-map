<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSavedPlace, type IsSavedPlaceResponse } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import Map from '$lib/components/Map.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { toast } from '$lib/stores/toast';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Eye from 'lucide-svelte/icons/eye';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Pencil from 'lucide-svelte/icons/pencil';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let saved: IsSavedPlaceResponse = $state(data.saved);
	let saving = $state(false);

	const savePlace = async () => {
		saving = true;
		try {
			await createSavedPlace(data.place.id);
			saved = { ...saved, isSaved: true };
			toast('Saved to your places', 'success');
		} finally {
			saving = false;
		}
	};

	const goBack = () => {
		if (typeof history !== 'undefined' && history.length > 1) {
			history.back();
		} else {
			goto('/place/search');
		}
	};
</script>

{#snippet backIcon()}<ChevronLeft class="h-5 w-5" />{/snippet}
{#snippet viewPrefix()}<Eye class="h-4 w-4" />{/snippet}
{#snippet savePrefix()}<Bookmark class="h-4 w-4" />{/snippet}
{#snippet editPrefix()}<Pencil class="h-4 w-4" />{/snippet}

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<div class="mb-4 flex items-center gap-2">
		<IconButton label="Go back" variant="ghost" tone="neutral" onclick={goBack} icon={backIcon} />
	</div>

	{#if data.place}
		<div class="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
			<div class="space-y-4">
				<div class="h-48 overflow-hidden rounded-xl md:h-80">
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

				<div class="space-y-2">
					<h1 class="text-2xl font-semibold leading-7 text-fg md:text-[28px]">
						{data.place.name}
					</h1>
					{#if data.place.description}
						<p class="text-fg-muted">{data.place.description}</p>
					{/if}
					{#if data.place.address}
						<div class="flex items-start gap-2 text-sm text-fg-muted">
							<MapPinIcon class="mt-0.5 h-4 w-4 shrink-0" />
							<span>{data.place.address}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Desktop action stack -->
			<div class="hidden space-y-2 lg:block">
				{#if saved.isSaved}
					<Button
						variant="outline"
						tone="neutral"
						fullwidth
						href={`/saved/${saved.id}`}
						prefix={viewPrefix}
					>
						View in my places
					</Button>
				{:else}
					<Button
						variant="solid"
						tone="accent"
						fullwidth
						loading={saving}
						onclick={savePlace}
						prefix={savePrefix}
					>
						Save to my places
					</Button>
				{/if}
				<Button variant="ghost" tone="neutral" fullwidth prefix={editPrefix}>
					Suggest an edit
				</Button>
			</div>
		</div>
	{/if}
</div>

<!-- Mobile sticky action bar -->
{#if data.place}
	<div
		class="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-bg-elevated px-4 py-3 shadow-lg lg:hidden"
	>
		<div class="mx-auto flex max-w-md flex-col gap-2">
			{#if saved.isSaved}
				<Button
					variant="outline"
					tone="neutral"
					fullwidth
					href={`/saved/${saved.id}`}
					prefix={viewPrefix}
				>
					View in my places
				</Button>
			{:else}
				<Button
					variant="solid"
					tone="accent"
					fullwidth
					loading={saving}
					onclick={savePlace}
					prefix={savePrefix}
				>
					Save to my places
				</Button>
			{/if}
			<Button variant="ghost" tone="neutral" fullwidth prefix={editPrefix}>Suggest an edit</Button>
		</div>
	</div>
{/if}
