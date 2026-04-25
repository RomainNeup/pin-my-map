<script lang="ts">
	import { goto } from '$app/navigation';
	import { searchPlaces, type Place } from '$lib/api/place';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Loader from '$lib/components/Loader.svelte';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';

	let query = $state('');
	let results = $state<Place[] | null>(null);
	let loading = $state(false);
	let open = $state(false);

	let debounceHandle: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	const runSearch = async (q: string) => {
		const id = ++requestId;
		loading = true;
		try {
			const r = await searchPlaces(q);
			if (id !== requestId) return;
			results = r;
		} catch {
			if (id !== requestId) return;
			results = [];
		} finally {
			if (id === requestId) loading = false;
		}
	};

	const onInput = () => {
		open = true;
		if (debounceHandle) clearTimeout(debounceHandle);
		if (query.trim().length < 3) {
			results = null;
			loading = false;
			return;
		}
		const q = query;
		debounceHandle = setTimeout(() => runSearch(q), 300);
	};

	const clear = () => {
		query = '';
		results = null;
		loading = false;
		if (debounceHandle) clearTimeout(debounceHandle);
	};

	const close = () => {
		open = false;
	};

	const goToPlace = (id: string) => {
		close();
		goto(`/place/${id}`);
	};

	const goToCreate = () => {
		close();
		goto(`/place/create`);
	};

	const showDropdown = $derived(open && query.trim().length >= 3);
</script>

<div class="relative w-full" use:clickOutside={close}>
	<div
		class="bg-bg-elevated/90 pointer-events-auto flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm shadow-md backdrop-blur-sm"
	>
		<Search class="h-4 w-4 text-fg-muted" />
		<input
			type="text"
			bind:value={query}
			oninput={onInput}
			onfocus={() => (open = true)}
			placeholder="Search places or tags"
			class="flex-1 border-0 bg-transparent p-0 text-fg placeholder:text-fg-muted focus:border-0 focus:outline-hidden focus:ring-0"
		/>
		{#if query.length > 0}
			<button
				type="button"
				class="-mr-1 flex h-6 w-6 items-center justify-center rounded-full text-fg-muted hover:bg-bg-muted"
				onclick={clear}
				aria-label="Clear search"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		{/if}
	</div>

	{#if showDropdown}
		<div
			class="absolute left-0 right-0 top-full z-popover mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-bg-elevated shadow-lg"
		>
			{#if loading}
				<div class="flex items-center justify-center py-6">
					<Loader size="md" />
				</div>
			{:else if results && results.length > 0}
				<ul class="py-1">
					{#each results as place (place.id)}
						<li>
							<button
								type="button"
								class="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-muted"
								onclick={() => goToPlace(place.id)}
							>
								<div
									class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg"
								>
									<MapPinIcon class="h-4 w-4" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm font-medium text-fg">{place.name}</div>
									{#if place.address}
										<div class="truncate text-xs text-fg-muted">{place.address}</div>
									{/if}
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{:else if results}
				<div class="px-4 py-6 text-center text-sm text-fg-muted">
					No places match "{query.trim()}".
				</div>
			{/if}

			<div class="border-t border-border">
				<button
					type="button"
					class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-accent hover:bg-bg-muted"
					onclick={goToCreate}
				>
					<Plus class="h-4 w-4" />
					<span>Create a new place</span>
				</button>
			</div>
		</div>
	{/if}
</div>
