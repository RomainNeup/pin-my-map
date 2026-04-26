<script lang="ts">
	import {
		approveSuggestion,
		listSuggestions,
		rejectSuggestion,
		type Suggestion,
		type SuggestionStatus
	} from '$lib/api/suggestion';
	import { listPending, approvePlace, rejectPlace, type Place } from '$lib/api/place';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { toast } from '$lib/stores/toast';

	// Top-level tab
	type Tab = 'edits' | 'places';
	let activeTab = $state<Tab>('edits');

	// ── Edits (suggestions) ──────────────────────────────────────────────────
	let status = $state<SuggestionStatus>('pending');
	let suggestions = $state<Suggestion[]>([]);
	let suggestionsLoading = $state(false);
	let suggBusyId = $state<string | null>(null);
	let suggRejectingId = $state<string | null>(null);
	let suggRejectReason = $state('');

	const loadSuggestions = async () => {
		suggestionsLoading = true;
		try {
			suggestions = await listSuggestions(status);
		} catch {
			// toasted
		} finally {
			suggestionsLoading = false;
		}
	};

	$effect(() => {
		void status;
		if (activeTab === 'edits') loadSuggestions();
	});

	const approveSugg = async (id: string) => {
		suggBusyId = id;
		try {
			await approveSuggestion(id);
			toast('Suggestion approved', 'success');
			await loadSuggestions();
		} finally {
			suggBusyId = null;
		}
	};

	const openRejectSugg = (id: string) => {
		suggRejectingId = id;
		suggRejectReason = '';
	};

	const confirmRejectSugg = async () => {
		if (!suggRejectingId) return;
		suggBusyId = suggRejectingId;
		try {
			await rejectSuggestion(suggRejectingId, suggRejectReason.trim() || undefined);
			toast('Suggestion rejected', 'info');
			suggRejectingId = null;
			suggRejectReason = '';
			await loadSuggestions();
		} finally {
			suggBusyId = null;
		}
	};

	const fieldRow = (
		label: string,
		current: unknown,
		proposed: unknown
	): { label: string; current: string; proposed: string } => ({
		label,
		current: current === undefined || current === null || current === '' ? '—' : String(current),
		proposed:
			proposed === undefined || proposed === null || proposed === '' ? '—' : String(proposed)
	});

	const rowsFor = (s: Suggestion) => {
		const rows: { label: string; current: string; proposed: string }[] = [];
		const p = s.place;
		if (s.changes.name !== undefined) rows.push(fieldRow('Name', p?.name, s.changes.name));
		if (s.changes.description !== undefined)
			rows.push(fieldRow('Description', p?.description, s.changes.description));
		if (s.changes.address !== undefined)
			rows.push(fieldRow('Address', p?.address, s.changes.address));
		if (s.changes.image !== undefined) rows.push(fieldRow('Image', p?.image, s.changes.image));
		if (s.changes.location)
			rows.push(
				fieldRow(
					'Location',
					p ? `${p.location.lat.toFixed(5)}, ${p.location.lng.toFixed(5)}` : '—',
					`${s.changes.location.lat.toFixed(5)}, ${s.changes.location.lng.toFixed(5)}`
				)
			);
		if (s.changes.permanentlyClosed !== undefined)
			rows.push(
				fieldRow(
					'Closed',
					p?.permanentlyClosed ? 'Mark closed' : 'Open',
					s.changes.permanentlyClosed ? 'Mark closed' : 'Reopen'
				)
			);
		return rows;
	};

	// ── New places ───────────────────────────────────────────────────────────
	let pendingPlaces = $state<Place[]>([]);
	let placesLoading = $state(false);
	let placeBusyId = $state<string | null>(null);
	let placeRejectingId = $state<string | null>(null);
	let placeRejectReason = $state('');

	const loadPendingPlaces = async () => {
		placesLoading = true;
		try {
			pendingPlaces = await listPending();
		} catch {
			// toasted
		} finally {
			placesLoading = false;
		}
	};

	$effect(() => {
		if (activeTab === 'places') loadPendingPlaces();
	});

	const approvePl = async (id: string) => {
		placeBusyId = id;
		try {
			await approvePlace(id);
			toast('Place approved', 'success');
			await loadPendingPlaces();
		} finally {
			placeBusyId = null;
		}
	};

	const openRejectPlace = (id: string) => {
		placeRejectingId = id;
		placeRejectReason = '';
	};

	const confirmRejectPlace = async () => {
		if (!placeRejectingId) return;
		placeBusyId = placeRejectingId;
		try {
			await rejectPlace(placeRejectingId, placeRejectReason.trim() || undefined);
			toast('Place rejected', 'info');
			placeRejectingId = null;
			placeRejectReason = '';
			await loadPendingPlaces();
		} finally {
			placeBusyId = null;
		}
	};
</script>

<div class="space-y-4">
	<!-- Top-level tab switcher -->
	<div class="flex gap-1 rounded-lg border border-border bg-bg-elevated p-1">
		<button
			class="flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
			class:bg-accent={activeTab === 'edits'}
			class:text-bg={activeTab === 'edits'}
			class:text-fg-muted={activeTab !== 'edits'}
			onclick={() => (activeTab = 'edits')}
		>
			Edits
		</button>
		<button
			class="flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
			class:bg-accent={activeTab === 'places'}
			class:text-bg={activeTab === 'places'}
			class:text-fg-muted={activeTab !== 'places'}
			onclick={() => (activeTab = 'places')}
		>
			New places
		</button>
	</div>

	<!-- ── EDITS TAB ──────────────────────────────────────────────────────── -->
	{#if activeTab === 'edits'}
		<div class="flex gap-2">
			{#each ['pending', 'approved', 'rejected'] as s (s)}
				<button
					class="rounded-full border px-3 py-1 text-sm transition-colors"
					class:border-accent={status === s}
					class:text-accent={status === s}
					class:border-border={status !== s}
					class:text-fg-muted={status !== s}
					onclick={() => (status = s as SuggestionStatus)}
				>
					{s}
				</button>
			{/each}
		</div>

		{#if suggestionsLoading}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else if suggestions.length === 0}
			<p class="text-sm text-fg-muted">No {status} suggestions.</p>
		{:else}
			<ul class="space-y-4">
				{#each suggestions as s (s.id)}
					<li class="space-y-3 rounded-xl border border-border bg-bg-elevated p-4">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div>
								<p class="font-medium">
									{s.place?.name ?? `Place ${s.placeId}`}
								</p>
								<p class="text-xs text-fg-muted">
									by {s.submitterName ?? s.submitterEmail ?? s.submitterId} ·
									{new Date(s.createdAt).toLocaleString()}
								</p>
							</div>
							<span
								class="rounded-full px-2 py-0.5 text-xs"
								class:bg-accent-soft={s.status === 'pending'}
								class:text-accent={s.status === 'pending'}
								class:bg-success-soft={s.status === 'approved'}
								class:text-success={s.status === 'approved'}
								class:bg-danger-soft={s.status === 'rejected'}
								class:text-danger={s.status === 'rejected'}
							>
								{s.status}
							</span>
						</div>

						{#if s.note}
							<p class="rounded-md bg-bg-muted p-2 text-sm italic">"{s.note}"</p>
						{/if}

						<table class="w-full text-sm">
							<thead>
								<tr class="text-left text-xs uppercase text-fg-muted">
									<th class="w-24 py-1">Field</th>
									<th class="py-1">Current</th>
									<th class="py-1">Proposed</th>
								</tr>
							</thead>
							<tbody>
								{#each rowsFor(s) as row (row.label)}
									<tr class="border-t border-border">
										<td class="py-1 pr-2 font-medium">{row.label}</td>
										<td class="py-1 pr-2 text-fg-muted">{row.current}</td>
										<td class="py-1">{row.proposed}</td>
									</tr>
								{/each}
							</tbody>
						</table>

						{#if s.status === 'pending'}
							{#if suggRejectingId === s.id}
								<div class="space-y-2">
									<Input
										type="textarea"
										bind:value={suggRejectReason}
										placeholder="Reason (optional)"
									/>
									<div class="flex justify-end gap-2">
										<Button
											variant="ghost"
											tone="neutral"
											onclick={() => {
												suggRejectingId = null;
												suggRejectReason = '';
											}}
										>
											Cancel
										</Button>
										<Button tone="danger" onclick={confirmRejectSugg} loading={suggBusyId === s.id}>
											Confirm reject
										</Button>
									</div>
								</div>
							{:else}
								<div class="flex justify-end gap-2">
									<Button
										variant="outline"
										tone="danger"
										onclick={() => openRejectSugg(s.id)}
										disabled={suggBusyId === s.id}
									>
										Reject
									</Button>
									<Button onclick={() => approveSugg(s.id)} loading={suggBusyId === s.id}>
										Approve
									</Button>
								</div>
							{/if}
						{:else if s.reviewReason}
							<p class="text-xs text-fg-muted">Reviewer note: {s.reviewReason}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<!-- ── NEW PLACES TAB ─────────────────────────────────────────────────── -->
	{#if activeTab === 'places'}
		{#if placesLoading}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else if pendingPlaces.length === 0}
			<p class="text-sm text-fg-muted">No pending places.</p>
		{:else}
			<ul class="space-y-4">
				{#each pendingPlaces as place (place.id)}
					<li class="space-y-3 rounded-xl border border-border bg-bg-elevated p-4">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="flex-1">
								<p class="font-medium">{place.name}</p>
								<p class="text-sm text-fg-muted">{place.address}</p>
								{#if place.creatorName ?? place.creatorEmail}
									<p class="text-xs text-fg-muted">
										by {place.creatorName ?? place.creatorEmail}
										{#if place.createdAt}
											· {new Date(place.createdAt).toLocaleString()}
										{/if}
									</p>
								{/if}
							</div>
							<span class="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
								pending
							</span>
						</div>

						{#if place.description}
							<p class="text-sm text-fg-muted">{place.description}</p>
						{/if}

						{#if place.enrichment?.photos && place.enrichment.photos.length > 0}
							<div class="flex gap-2 overflow-x-auto">
								{#each place.enrichment.photos.slice(0, 3) as photo (photo.url)}
									<img
										src={photo.url}
										alt=""
										class="h-20 w-28 shrink-0 rounded-lg object-cover"
									/>
								{/each}
							</div>
						{:else if place.image}
							<img
								src={place.image}
								alt="Place"
								class="h-32 w-full rounded-lg object-cover"
							/>
						{/if}

						{#if placeRejectingId === place.id}
							<div class="space-y-2">
								<Input
									type="textarea"
									bind:value={placeRejectReason}
									placeholder="Reason (optional)"
								/>
								<div class="flex justify-end gap-2">
									<Button
										variant="ghost"
										tone="neutral"
										onclick={() => {
											placeRejectingId = null;
											placeRejectReason = '';
										}}
									>
										Cancel
									</Button>
									<Button
										tone="danger"
										onclick={confirmRejectPlace}
										loading={placeBusyId === place.id}
									>
										Confirm reject
									</Button>
								</div>
							</div>
						{:else}
							<div class="flex justify-end gap-2">
								<Button
									variant="outline"
									tone="danger"
									onclick={() => openRejectPlace(place.id)}
									disabled={placeBusyId === place.id}
								>
									Reject
								</Button>
								<Button onclick={() => approvePl(place.id)} loading={placeBusyId === place.id}>
									Approve
								</Button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
