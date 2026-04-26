<script lang="ts">
	import { onMount } from 'svelte';
	import {
		listConflicts,
		resolveConflict,
		dismissConflict,
		type Place,
		type EnrichmentConflict
	} from '$lib/api/place';
	import { toast } from '$lib/stores/toast';

	let places = $state<Place[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let error = $state('');

	// Selected radio values: placeId → field → { provider, value }
	let selections = $state<Record<string, Record<string, string>>>({});

	const LIMIT = 20;
	let offset = $state(0);

	async function load() {
		loading = true;
		error = '';
		try {
			const page = await listConflicts({ limit: LIMIT, offset });
			places = page.items;
			total = page.total;
		} catch (e) {
			error = (e as Error).message ?? 'Failed to load conflicts';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function getSelection(placeId: string, field: string): string {
		return selections[placeId]?.[field] ?? '';
	}

	function setSelection(placeId: string, field: string, key: string) {
		if (!selections[placeId]) selections[placeId] = {};
		selections[placeId][field] = key;
		// trigger reactivity
		selections = { ...selections };
	}

	function conflictKey(provider: string, value: unknown): string {
		return `${provider}::${JSON.stringify(value)}`;
	}

	async function handleResolve(place: Place, conflict: EnrichmentConflict) {
		const key = getSelection(place.id, conflict.field);
		if (!key) {
			toast('Select a value first', 'warning');
			return;
		}
		const entry = conflict.values.find((v) => conflictKey(v.provider, v.value) === key);
		if (!entry) return;
		try {
			await resolveConflict(place.id, conflict.field, entry.value);
			toast(`Conflict on "${conflict.field}" resolved`, 'success');
			await load();
		} catch (e) {
			toast((e as Error).message ?? 'Failed to resolve conflict', 'error');
		}
	}

	async function handleDismiss(place: Place, conflict: EnrichmentConflict) {
		try {
			await dismissConflict(place.id, conflict.field);
			toast(`Conflict on "${conflict.field}" dismissed`, 'info');
			await load();
		} catch (e) {
			toast((e as Error).message ?? 'Failed to dismiss conflict', 'error');
		}
	}

	function displayValue(value: unknown): string {
		if (value === null || value === undefined) return '—';
		if (typeof value === 'boolean') return value ? 'Yes' : 'No';
		return String(value);
	}

	function prevPage() {
		if (offset >= LIMIT) {
			offset -= LIMIT;
			load();
		}
	}

	function nextPage() {
		if (offset + LIMIT < total) {
			offset += LIMIT;
			load();
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Enrichment Conflicts</h2>
			<p class="text-sm text-fg-muted">
				Places where two or more enrichment providers returned different values.
			</p>
		</div>
		{#if total > 0}
			<span class="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
				{total} place{total !== 1 ? 's' : ''} with conflicts
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex h-40 items-center justify-center text-sm text-fg-muted">Loading…</div>
	{:else if error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
	{:else if places.length === 0}
		<div class="flex h-40 items-center justify-center text-sm text-fg-muted">
			No conflicts to review.
		</div>
	{:else}
		<div class="space-y-6">
			{#each places as place (place.id)}
				<div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
					<div class="mb-3">
						<h3 class="font-semibold">{place.name}</h3>
						<p class="text-sm text-fg-muted">{place.address}</p>
					</div>

					{#each place.enrichmentConflicts ?? [] as conflict (conflict.field)}
						<div class="mt-3 rounded-md border border-orange-200 bg-orange-50 p-3">
							<p class="mb-2 text-sm font-medium text-orange-900">
								Field: <span class="font-mono">{conflict.field}</span>
							</p>

							<div class="space-y-1">
								{#each conflict.values as entry}
									{@const key = conflictKey(entry.provider, entry.value)}
									<label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-orange-100">
										<input
											type="radio"
											name="{place.id}-{conflict.field}"
											value={key}
											checked={getSelection(place.id, conflict.field) === key}
											onchange={() => setSelection(place.id, conflict.field, key)}
											class="accent-orange-500"
										/>
										<span class="text-xs text-fg-muted">{entry.provider}:</span>
										<span class="text-sm font-medium">{displayValue(entry.value)}</span>
									</label>
								{/each}
							</div>

							<div class="mt-3 flex gap-2">
								<button
									onclick={() => handleResolve(place, conflict)}
									disabled={!getSelection(place.id, conflict.field)}
									class="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Apply selected
								</button>
								<button
									onclick={() => handleDismiss(place, conflict)}
									class="rounded border border-border px-3 py-1 text-xs text-fg-muted hover:bg-surface-muted"
								>
									Dismiss
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>

		{#if total > LIMIT}
			<div class="flex items-center justify-between text-sm text-fg-muted">
				<span>Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
				<div class="flex gap-2">
					<button
						onclick={prevPage}
						disabled={offset === 0}
						class="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-40"
					>
						Previous
					</button>
					<button
						onclick={nextPage}
						disabled={offset + LIMIT >= total}
						class="rounded border border-border px-3 py-1 hover:bg-surface-muted disabled:opacity-40"
					>
						Next
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
