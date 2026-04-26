<script lang="ts">
	import { goBack } from '$lib/utils/navigation';
	import { refreshEnrichment, setPermanentlyClosed, type Place } from '$lib/api/place';
	import { createSavedPlace, type IsSavedPlaceResponse } from '$lib/api/savedPlace';
	import Button from '$lib/components/Button.svelte';
	import Map from '$lib/components/Map.svelte';
	import EditPlaceDialog from '$lib/components/place/EditPlaceDialog.svelte';
	import PlaceEnrichmentDetails from '$lib/components/place/PlaceEnrichmentDetails.svelte';
	import SuggestEditDialog from '$lib/components/place/SuggestEditDialog.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { currentUser } from '$lib/stores/user';
	import { toast } from '$lib/stores/toast';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import DotsHorizontal from 'lucide-svelte/icons/ellipsis';
	import Eye from 'lucide-svelte/icons/eye';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Pencil from 'lucide-svelte/icons/pencil';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import XOctagon from 'lucide-svelte/icons/octagon-x';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();

	let saved: IsSavedPlaceResponse = $state(data.saved);
	let saving = $state(false);
	let suggestOpen = $state(false);
	let editOpen = $state(false);
	let place: Place = $state(data.place);
	let refreshing = $state(false);

	// overflow menu state
	let overflowOpen = $state(false);
	let overflowAnchor = $state<HTMLElement | null>(null);
	let overflowAnchorMobile = $state<HTMLElement | null>(null);
	let overflowOpenMobile = $state(false);

	const canEdit = $derived(
		$currentUser !== null &&
			(place.createdBy === $currentUser.id || $currentUser.role === 'admin')
	);

	const isAdmin = $derived($currentUser?.role === 'admin');

	const handleToggleClosed = async (closed: boolean) => {
		overflowOpen = false;
		overflowOpenMobile = false;
		try {
			place = await setPermanentlyClosed(place.id, closed);
			toast(closed ? 'Place marked as permanently closed' : 'Place reopened', 'success');
		} catch {
			toast('Failed to update closure status', 'error');
		}
	};

	const handleRefresh = async () => {
		overflowOpen = false;
		overflowOpenMobile = false;
		refreshing = true;
		try {
			place = await refreshEnrichment(place.id);
			toast('Place data refreshed', 'success');
		} catch {
			toast('Failed to refresh data', 'error');
		} finally {
			refreshing = false;
		}
	};

	const savePlace = async () => {
		saving = true;
		try {
			await createSavedPlace(place.id);
			saved = { ...saved, isSaved: true };
			toast('Saved to your places', 'success');
		} finally {
			saving = false;
		}
	};

	const onBack = () => goBack('/place/search');
</script>

{#snippet backIcon()}<ChevronLeft class="h-5 w-5" />{/snippet}
{#snippet dotsIcon()}<DotsHorizontal class="h-5 w-5" />{/snippet}
{#snippet viewPrefix()}<Eye class="h-4 w-4" />{/snippet}
{#snippet savePrefix()}<Bookmark class="h-4 w-4" />{/snippet}

<!-- Shared overflow menu items snippet -->
{#snippet overflowItems(closeFn: () => void)}
	{#if canEdit}
		<button
			type="button"
			class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fg hover:bg-bg-muted"
			role="menuitem"
			onclick={() => { closeFn(); editOpen = true; }}
		>
			<Pencil class="h-4 w-4 text-fg-muted" />
			Edit place
		</button>
	{/if}
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fg hover:bg-bg-muted"
		role="menuitem"
		onclick={() => { closeFn(); suggestOpen = true; }}
	>
		<Pencil class="h-4 w-4 text-fg-muted" />
		Suggest an edit
	</button>
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fg hover:bg-bg-muted disabled:cursor-not-allowed disabled:opacity-60"
		role="menuitem"
		disabled={refreshing}
		onclick={handleRefresh}
	>
		<RefreshCw class={`h-4 w-4 text-fg-muted ${refreshing ? 'animate-spin' : ''}`} />
		Refresh data
	</button>
	{#if isAdmin}
		<div class="my-1 border-t border-border"></div>
		<button
			type="button"
			class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm {place.permanentlyClosed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} hover:bg-bg-muted"
			role="menuitem"
			onclick={() => handleToggleClosed(!place.permanentlyClosed)}
		>
			<XOctagon class="h-4 w-4" />
			{place.permanentlyClosed ? 'Reopen place' : 'Mark as permanently closed'}
		</button>
	{/if}
{/snippet}

<div class="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
	<div class="mb-4 flex items-center gap-2">
		<IconButton label="Go back" variant="ghost" tone="neutral" onclick={onBack} icon={backIcon} />
	</div>

	{#if place}
		<div class="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
			<div class="space-y-4">
				<div class="h-48 overflow-hidden rounded-xl md:h-80">
					<Map
						sources={[
							{
								key: place.id,
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
					/>
				</div>

				<div class="space-y-2">
					<h1 class="text-2xl font-semibold leading-7 text-fg md:text-[28px]">
						{place.name}
					</h1>
					{#if place.summary}
						<p class="text-sm text-fg-muted">{place.summary}</p>
					{/if}
					{#if place.description}
						<p class="text-fg-muted">{place.description}</p>
					{/if}
					{#if place.address}
						<div class="flex items-start gap-2 text-sm text-fg-muted">
							<MapPinIcon class="mt-0.5 h-4 w-4 shrink-0" />
							<span>{place.address}</span>
						</div>
					{/if}
				</div>

				{#if place.enrichment}
					<PlaceEnrichmentDetails
						{place}
						enrichment={place.enrichment}
						{isAdmin}
						onToggleClosed={handleToggleClosed}
					/>
				{/if}
			</div>

			<!-- Desktop action stack -->
			<div class="hidden space-y-2 lg:block">
				<div class="flex items-center gap-2">
					<!-- Primary action -->
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

					<!-- Overflow menu trigger -->
					<div bind:this={overflowAnchor}>
						<IconButton
							label="More actions"
							variant="outline"
							tone="neutral"
							icon={dotsIcon}
							onclick={() => (overflowOpen = !overflowOpen)}
						/>
					</div>
				</div>

				<Popover bind:open={overflowOpen} anchor={overflowAnchor} placement="bottom-end">
					{@render overflowItems(() => (overflowOpen = false))}
				</Popover>
			</div>
		</div>
	{/if}
</div>

{#if place}
	<SuggestEditDialog bind:open={suggestOpen} {place} />
	{#if canEdit}
		<EditPlaceDialog bind:open={editOpen} {place} onUpdated={(updated) => (place = updated)} />
	{/if}
{/if}

<!-- Mobile sticky action bar -->
{#if place}
	<div
		class="sticky bottom-0 left-0 right-0 z-10 border-t border-border bg-bg-elevated px-4 py-3 shadow-lg lg:hidden"
	>
		<div class="mx-auto flex max-w-md items-center gap-2">
			<!-- Primary action -->
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

			<!-- Overflow menu trigger (mobile) -->
			<div bind:this={overflowAnchorMobile}>
				<IconButton
					label="More actions"
					variant="outline"
					tone="neutral"
					icon={dotsIcon}
					onclick={() => (overflowOpenMobile = !overflowOpenMobile)}
				/>
			</div>
		</div>

		<Popover bind:open={overflowOpenMobile} anchor={overflowAnchorMobile} placement="top-end">
			{@render overflowItems(() => (overflowOpenMobile = false))}
		</Popover>
	</div>
{/if}
