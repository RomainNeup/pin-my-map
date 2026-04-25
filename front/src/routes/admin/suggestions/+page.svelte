<script lang="ts">
	import {
		approveSuggestion,
		listSuggestions,
		rejectSuggestion,
		type Suggestion,
		type SuggestionStatus
	} from '$lib/api/suggestion';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { toast } from '$lib/stores/toast';

	let status = $state<SuggestionStatus>('pending');
	let suggestions = $state<Suggestion[]>([]);
	let loading = $state(false);
	let busyId = $state<string | null>(null);
	let rejectingId = $state<string | null>(null);
	let rejectReason = $state('');

	const load = async () => {
		loading = true;
		try {
			suggestions = await listSuggestions(status);
		} catch {
			// toasted
		} finally {
			loading = false;
		}
	};

	$effect(() => {
		void status;
		load();
	});

	const approve = async (id: string) => {
		busyId = id;
		try {
			await approveSuggestion(id);
			toast('Suggestion approved', 'success');
			await load();
		} finally {
			busyId = null;
		}
	};

	const openReject = (id: string) => {
		rejectingId = id;
		rejectReason = '';
	};

	const confirmReject = async () => {
		if (!rejectingId) return;
		busyId = rejectingId;
		try {
			await rejectSuggestion(rejectingId, rejectReason.trim() || undefined);
			toast('Suggestion rejected', 'info');
			rejectingId = null;
			rejectReason = '';
			await load();
		} finally {
			busyId = null;
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
		return rows;
	};
</script>

<div class="space-y-4">
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

	{#if loading}
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
						<p class="rounded-md bg-bg-muted p-2 text-sm italic">“{s.note}”</p>
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
						{#if rejectingId === s.id}
							<div class="space-y-2">
								<Input type="textarea" bind:value={rejectReason} placeholder="Reason (optional)" />
								<div class="flex justify-end gap-2">
									<Button
										variant="ghost"
										tone="neutral"
										onclick={() => {
											rejectingId = null;
											rejectReason = '';
										}}
									>
										Cancel
									</Button>
									<Button tone="danger" onclick={confirmReject} loading={busyId === s.id}>
										Confirm reject
									</Button>
								</div>
							</div>
						{:else}
							<div class="flex justify-end gap-2">
								<Button
									variant="outline"
									tone="danger"
									onclick={() => openReject(s.id)}
									disabled={busyId === s.id}
								>
									Reject
								</Button>
								<Button onclick={() => approve(s.id)} loading={busyId === s.id}>Approve</Button>
							</div>
						{/if}
					{:else if s.reviewReason}
						<p class="text-xs text-fg-muted">Reviewer note: {s.reviewReason}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
