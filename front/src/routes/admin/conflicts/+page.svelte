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
	import Button from '$lib/components/Button.svelte';

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
			<span class="rounded-full bg-bg-muted px-3 py-1 text-sm font-medium text-fg-muted">
				{total} place{total !== 1 ? 's' : ''} with conflicts
			</span>
		{/if}
	</div>

	{#if loading}
		<div class="flex h-40 items-center justify-center text-sm text-fg-muted">Loading…</div>
	{:else if error}
		<div class="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>
	{:else if places.length === 0}
		<div class="flex h-40 items-center justify-center text-sm text-fg-muted">
			No conflicts to review.
		</div>
	{:else}
		<div class="space-y-6">
			{#each places as place (place.id)}
				<div class="rounded-lg border border-border bg-bg-elevated p-4 shadow-sm">
					<div class="mb-3">
						<h3 class="font-semibold">{place.name}</h3>
						<p class="text-sm text-fg-muted">{place.address}</p>
					</div>

					{#each place.enrichmentConflicts ?? [] as conflict (conflict.field)}
						<div class="mt-3 rounded-md border border-border bg-bg-muted p-3">
							<p class="mb-2 text-sm font-medium text-fg">
								Field: <span class="font-mono text-accent">{conflict.field}</span>
							</p>

							<div class="space-y-1">
								{#each conflict.values as entry}
									{@const key = conflictKey(entry.provider, entry.value)}
									<label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-bg-elevated">
										<input
											type="radio"
											name="{place.id}-{conflict.field}"
											value={key}
											checked={getSelection(place.id, conflict.field) === key}
											onchange={() => setSelection(place.id, conflict.field, key)}
											class="accent-accent"
										/>
										<span class="text-xs text-fg-muted">{entry.provider}:</span>
										<span class="text-sm font-medium">{displayValue(entry.value)}</span>
									</label>
								{/each}
							</div>

							<div class="mt-3 flex gap-2">
								<Button
									size="sm"
									tone="accent"
									disabled={!getSelection(place.id, conflict.field)}
									onclick={() => handleResolve(place, conflict)}
								>
									Apply selected
								</Button>
								<Button
									size="sm"
									variant="ghost"
									tone="neutral"
									onclick={() => handleDismiss(place, conflict)}
								>
									Dismiss
								</Button>
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
					<Button
						variant="outline"
						tone="neutral"
						size="sm"
						disabled={offset === 0}
						onclick={prevPage}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						tone="neutral"
						size="sm"
						disabled={offset + LIMIT >= total}
						onclick={nextPage}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>
