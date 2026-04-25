<script lang="ts">
	import { onMount } from 'svelte';
	import {
		listUsers,
		listPending,
		approveUser,
		rejectUser,
		suspendUser,
		unsuspendUser,
		inviteUser,
		updateUserRole,
		deleteUser,
		type AdminUser,
		type UserStatus
	} from '$lib/api/user';
	import { getConfig, updateConfig, type RegistrationMode } from '$lib/api/config';
	import { bulkEnrich, type BulkEnrichSummary } from '$lib/api/place';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { currentUser, type UserRole } from '$lib/stores/user';
	import { toast } from '$lib/stores/toast';
	import { confirm } from '$lib/stores/confirm';

	// ── Types ──────────────────────────────────────────────────────────────────

	type Tab = 'active' | 'pending' | 'rejected-suspended';

	// ── State ──────────────────────────────────────────────────────────────────

	// Settings card
	let registrationMode = $state<RegistrationMode>('open');
	let configLoading = $state(false);
	let configSaving = $state(false);

	// Tab
	let activeTab = $state<Tab>('active');

	// Search / filter
	let searchQ = $state('');
	let statusFilter = $state<string>('');

	// Pagination
	const PAGE_SIZE = 30;
	let offset = $state(0);

	// Users
	let users = $state<AdminUser[]>([]);
	let loading = $state(false);
	let busyId = $state<string | null>(null);

	// Reject inline (pending tab)
	let rejectingId = $state<string | null>(null);
	let rejectReason = $state('');

	// Suspend modal
	let suspendOpen = $state(false);
	let suspendTarget = $state<AdminUser | null>(null);
	let suspendReason = $state('');
	let suspendSaving = $state(false);

	// Invite modal
	let inviteOpen = $state(false);
	let inviteName = $state('');
	let inviteEmail = $state('');
	let inviteRole = $state<UserRole>('user');
	let inviteSaving = $state(false);

	// ── Helpers ────────────────────────────────────────────────────────────────

	const statusLabel: Record<UserStatus, string> = {
		active: 'Active',
		pending: 'Pending',
		rejected: 'Rejected',
		suspended: 'Suspended'
	};

	const statusBadgeCls: Record<UserStatus, string> = {
		active: 'bg-success-soft text-success',
		pending: 'bg-accent-soft text-accent',
		rejected: 'bg-danger-soft text-danger',
		suspended: 'bg-bg-muted text-fg-muted'
	};

	// ── Load config ────────────────────────────────────────────────────────────

	const loadConfig = async () => {
		configLoading = true;
		try {
			const cfg = await getConfig();
			registrationMode = cfg.registrationMode;
		} finally {
			configLoading = false;
		}
	};

	const saveConfig = async () => {
		configSaving = true;
		try {
			const cfg = await updateConfig({ registrationMode });
			registrationMode = cfg.registrationMode;
			toast('Configuration saved', 'success');
		} finally {
			configSaving = false;
		}
	};

	// ── Load users ─────────────────────────────────────────────────────────────

	const loadUsers = async () => {
		loading = true;
		try {
			if (activeTab === 'pending') {
				users = await listPending();
				return;
			}

			if (activeTab === 'active') {
				users = await listUsers({
					q: searchQ.trim() || undefined,
					status: 'active',
					limit: PAGE_SIZE,
					offset
				});
				return;
			}

			// rejected-suspended tab
			const specificStatus = statusFilter === 'rejected' || statusFilter === 'suspended'
				? (statusFilter as UserStatus)
				: undefined;

			if (specificStatus) {
				users = await listUsers({
					q: searchQ.trim() || undefined,
					status: specificStatus,
					limit: PAGE_SIZE,
					offset
				});
			} else {
				const [rejected, suspended] = await Promise.all([
					listUsers({
						q: searchQ.trim() || undefined,
						status: 'rejected',
						limit: PAGE_SIZE,
						offset
					}),
					listUsers({
						q: searchQ.trim() || undefined,
						status: 'suspended',
						limit: PAGE_SIZE,
						offset
					})
				]);
				users = [...rejected, ...suspended];
			}
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		loadConfig();
		loadUsers();
	});

	// Reload when tab changes (reset search/pagination)
	let prevTab = $state<Tab>('active');
	$effect(() => {
		if (activeTab !== prevTab) {
			prevTab = activeTab;
			offset = 0;
			searchQ = '';
			statusFilter = '';
			loadUsers();
		}
	});

	const applySearch = () => {
		offset = 0;
		loadUsers();
	};

	// ── Actions ────────────────────────────────────────────────────────────────

	const changeRole = async (id: string, role: UserRole) => {
		busyId = id;
		try {
			const updated = await updateUserRole(id, role);
			users = users.map((u) => (u.id === id ? updated : u));
			toast(`Role updated to ${role}`, 'success');
		} finally {
			busyId = null;
		}
	};

	const approve = async (id: string) => {
		busyId = id;
		try {
			await approveUser(id);
			toast('User approved', 'success');
			await loadUsers();
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
			await rejectUser(rejectingId, rejectReason.trim() || undefined);
			toast('User rejected', 'info');
			rejectingId = null;
			rejectReason = '';
			await loadUsers();
		} finally {
			busyId = null;
		}
	};

	const openSuspend = (user: AdminUser) => {
		suspendTarget = user;
		suspendReason = '';
		suspendOpen = true;
	};

	const closeSuspend = () => {
		suspendOpen = false;
		suspendTarget = null;
	};

	const confirmSuspend = async () => {
		if (!suspendTarget) return;
		suspendSaving = true;
		try {
			const updated = await suspendUser(suspendTarget.id, suspendReason.trim() || undefined);
			users = users.map((u) => (u.id === updated.id ? updated : u));
			toast('User suspended', 'info');
			suspendOpen = false;
			suspendTarget = null;
		} finally {
			suspendSaving = false;
		}
	};

	const doUnsuspend = async (id: string) => {
		busyId = id;
		try {
			const updated = await unsuspendUser(id);
			users = users.map((u) => (u.id === id ? updated : u));
			toast('User unsuspended', 'success');
		} finally {
			busyId = null;
		}
	};

	const remove = async (user: AdminUser) => {
		const ok = await confirm({
			title: 'Delete user?',
			message: `Delete ${user.name} (${user.email})? This cannot be undone.`,
			confirmLabel: 'Delete',
			tone: 'danger'
		});
		if (!ok) return;
		busyId = user.id;
		try {
			await deleteUser(user.id);
			users = users.filter((u) => u.id !== user.id);
			toast('User deleted', 'info');
		} finally {
			busyId = null;
		}
	};

	const openInvite = () => {
		inviteName = '';
		inviteEmail = '';
		inviteRole = 'user';
		inviteOpen = true;
	};

	// ── Maintenance ────────────────────────────────────────────────────────────

	let enrichBusy = $state(false);
	let enrichResult = $state<BulkEnrichSummary | null>(null);

	const runBulkEnrich = async (onlyMissing: boolean) => {
		enrichBusy = true;
		enrichResult = null;
		try {
			const result = await bulkEnrich({ onlyMissing, limit: 100, delayMs: 1100 });
			enrichResult = result;
			toast(
				`Enrichment done: ${result.enriched} enriched, ${result.skipped} skipped, ${result.failed} failed`,
				result.failed > 0 ? 'error' : 'success'
			);
		} catch {
			toast('Bulk enrichment failed', 'error');
		} finally {
			enrichBusy = false;
		}
	};

	const submitInvite = async () => {
		if (!inviteName.trim() || !inviteEmail.trim()) return;
		inviteSaving = true;
		try {
			const result = await inviteUser({
				name: inviteName.trim(),
				email: inviteEmail.trim(),
				role: inviteRole
			});
			if (result.tempPassword) {
				toast(`User created. Temp password: ${result.tempPassword}`, 'success', { duration: 0 });
			} else {
				toast('User invited — they will receive a setup email.', 'success');
			}
			inviteOpen = false;
			await loadUsers();
		} finally {
			inviteSaving = false;
		}
	};
</script>

<div class="space-y-6">
	<!-- ── Settings card ──────────────────────────────────────────────────── -->
	<div class="rounded-xl border border-border bg-bg-elevated p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
			Registration settings
		</h2>
		{#if configLoading}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else}
			<div class="flex flex-wrap items-center gap-3">
				<label class="text-sm font-medium" for="reg-mode">Registration mode</label>
				<select
					id="reg-mode"
					class="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
					bind:value={registrationMode}
					disabled={configSaving}
				>
					<option value="open">Open (anyone can register)</option>
					<option value="approval-required">Approval required</option>
					<option value="invite-only">Invite only</option>
				</select>
				<Button size="sm" loading={configSaving} onclick={saveConfig}>Save</Button>
			</div>
		{/if}
	</div>

	<!-- ── Maintenance card ──────────────────────────────────────────────── -->
	<div class="rounded-xl border border-border bg-bg-elevated p-4">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">Maintenance</h2>
		<div class="flex flex-wrap items-center gap-3">
			<Button
				size="sm"
				loading={enrichBusy}
				onclick={() => runBulkEnrich(true)}
			>
				Re-enrich missing places
			</Button>
			<Button
				size="sm"
				variant="outline"
				tone="neutral"
				loading={enrichBusy}
				onclick={() => runBulkEnrich(false)}
			>
				Re-enrich all (top 100)
			</Button>
		</div>
		{#if enrichResult}
			<div class="mt-3 rounded-lg border border-border bg-bg-muted p-3 text-sm">
				<div class="flex flex-wrap gap-4">
					<span>Scanned: <strong>{enrichResult.scanned}</strong></span>
					<span>Enriched: <strong class="text-success">{enrichResult.enriched}</strong></span>
					<span>Skipped: <strong class="text-fg-muted">{enrichResult.skipped}</strong></span>
					<span>Failed: <strong class={enrichResult.failed > 0 ? 'text-danger' : ''}>{enrichResult.failed}</strong></span>
				</div>
				{#if enrichResult.errors.length > 0}
					<ul class="mt-2 space-y-1 text-xs text-danger">
						{#each enrichResult.errors as err (err.placeId)}
							<li><code>{err.placeId}</code>: {err.message}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	<!-- ── Header row: tabs + invite ─────────────────────────────────────── -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-2">
			{#each ([['active', 'Active'], ['pending', 'Pending'], ['rejected-suspended', 'Rejected / Suspended']] as const) as [t, label] (t)}
				<button
					class="rounded-full border px-3 py-1 text-sm transition-colors"
					class:border-accent={activeTab === t}
					class:text-accent={activeTab === t}
					class:border-border={activeTab !== t}
					class:text-fg-muted={activeTab !== t}
					onclick={() => (activeTab = t)}
				>
					{label}
				</button>
			{/each}
		</div>
		<Button size="sm" onclick={openInvite}>Invite user</Button>
	</div>

	<!-- ── Search / filter (non-pending tabs) ────────────────────────────── -->
	{#if activeTab !== 'pending'}
		<div class="flex flex-wrap gap-2">
			<Input
				class="max-w-xs"
				placeholder="Search name or email…"
				bind:value={searchQ}
				onKeydown={(e) => e.key === 'Enter' && applySearch()}
			/>
			{#if activeTab === 'rejected-suspended'}
				<select
					class="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
					bind:value={statusFilter}
					onchange={() => {
						offset = 0;
						loadUsers();
					}}
				>
					<option value="">All</option>
					<option value="rejected">Rejected</option>
					<option value="suspended">Suspended</option>
				</select>
			{/if}
			<Button variant="outline" tone="neutral" size="sm" onclick={applySearch}>Search</Button>
		</div>
	{/if}

	<!-- ── Users table ────────────────────────────────────────────────────── -->
	{#if loading}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if users.length === 0}
		<p class="text-sm text-fg-muted">No users.</p>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<table class="w-full text-sm">
				<thead class="bg-bg-muted text-left text-xs uppercase text-fg-muted">
					<tr>
						<th class="px-3 py-2">Name</th>
						<th class="px-3 py-2">Email</th>
						<th class="px-3 py-2">Role</th>
						{#if activeTab !== 'active'}
							<th class="px-3 py-2">Status</th>
						{/if}
						<th class="px-3 py-2 text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each users as u (u.id)}
						<tr class="border-t border-border">
							<td class="px-3 py-2 font-medium">{u.name}</td>
							<td class="px-3 py-2 text-fg-muted">{u.email}</td>
							<td class="px-3 py-2">
								{#if activeTab === 'active'}
									<select
										class="rounded-md border border-border bg-bg-elevated px-2 py-1 text-sm"
										value={u.role}
										disabled={busyId === u.id || u.id === $currentUser?.id}
										onchange={(e) =>
											changeRole(u.id, (e.currentTarget as HTMLSelectElement).value as UserRole)}
									>
										<option value="user">user</option>
										<option value="admin">admin</option>
									</select>
								{:else}
									<span class="capitalize text-fg-muted">{u.role}</span>
								{/if}
							</td>

							{#if activeTab !== 'active'}
								<td class="px-3 py-2">
									<span class="rounded-full px-2 py-0.5 text-xs {statusBadgeCls[u.status] ?? ''}">
										{statusLabel[u.status] ?? u.status}
									</span>
									{#if u.rejectionReason}
										<p class="mt-0.5 text-xs text-fg-muted">{u.rejectionReason}</p>
									{/if}
									{#if u.suspensionReason}
										<p class="mt-0.5 text-xs text-fg-muted">{u.suspensionReason}</p>
									{/if}
								</td>
							{/if}

							<!-- Actions cell -->
							<td class="px-3 py-2">
								{#if activeTab === 'pending'}
									{#if rejectingId === u.id}
										<div class="flex flex-col gap-1">
											<Input
												type="textarea"
												bind:value={rejectReason}
												placeholder="Reason (optional)"
											/>
											<div class="flex justify-end gap-2">
												<Button
													variant="ghost"
													tone="neutral"
													size="sm"
													onclick={() => {
														rejectingId = null;
														rejectReason = '';
													}}
												>
													Cancel
												</Button>
												<Button
													tone="danger"
													size="sm"
													onclick={confirmReject}
													loading={busyId === u.id}
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
												size="sm"
												disabled={busyId === u.id}
												onclick={() => openReject(u.id)}
											>
												Reject
											</Button>
											<Button size="sm" loading={busyId === u.id} onclick={() => approve(u.id)}>
												Approve
											</Button>
										</div>
									{/if}
								{:else if activeTab === 'active'}
									<div class="flex justify-end gap-2">
										<Button
											variant="ghost"
											tone="neutral"
											size="sm"
											disabled={busyId === u.id || u.id === $currentUser?.id}
											onclick={() => openSuspend(u)}
										>
											Suspend
										</Button>
										<Button
											variant="ghost"
											tone="danger"
											size="sm"
											disabled={busyId === u.id || u.id === $currentUser?.id}
											onclick={() => remove(u)}
										>
											Delete
										</Button>
									</div>
								{:else}
									<!-- rejected-suspended tab -->
									<div class="flex justify-end gap-2">
										{#if u.status === 'suspended'}
											<Button
												variant="ghost"
												tone="neutral"
												size="sm"
												loading={busyId === u.id}
												onclick={() => doUnsuspend(u.id)}
											>
												Unsuspend
											</Button>
										{/if}
										<Button
											variant="ghost"
											tone="danger"
											size="sm"
											disabled={busyId === u.id}
											onclick={() => remove(u)}
										>
											Delete
										</Button>
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination (non-pending tabs) -->
		{#if activeTab !== 'pending'}
			<div class="flex items-center justify-between gap-2 text-sm text-fg-muted">
				<span>Showing {offset + 1}–{offset + users.length}</span>
				<div class="flex gap-2">
					<Button
						variant="outline"
						tone="neutral"
						size="sm"
						disabled={offset === 0}
						onclick={() => {
							offset = Math.max(0, offset - PAGE_SIZE);
							loadUsers();
						}}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						tone="neutral"
						size="sm"
						disabled={users.length < PAGE_SIZE}
						onclick={() => {
							offset += PAGE_SIZE;
							loadUsers();
						}}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- ── Suspend modal ──────────────────────────────────────────────────────── -->
<Dialog bind:open={suspendOpen} title="Suspend user" onClose={closeSuspend}>
	{#if suspendTarget}
		<p class="mb-3 text-sm">
			Suspend <strong>{suspendTarget.name}</strong>? They will not be able to log in.
		</p>
		<Input type="textarea" bind:value={suspendReason} placeholder="Reason (optional)" />
	{/if}
	{#snippet footer()}
		<Button variant="ghost" tone="neutral" onclick={closeSuspend} disabled={suspendSaving}>
			Cancel
		</Button>
		<Button tone="danger" loading={suspendSaving} onclick={confirmSuspend}>Suspend</Button>
	{/snippet}
</Dialog>

<!-- ── Invite modal ───────────────────────────────────────────────────────── -->
<Dialog bind:open={inviteOpen} title="Invite user">
	<div class="space-y-3">
		<div>
			<label class="mb-1 block text-sm font-medium" for="invite-name">Name</label>
			<Input id="invite-name" bind:value={inviteName} placeholder="Jane Doe" required />
		</div>
		<div>
			<label class="mb-1 block text-sm font-medium" for="invite-email">Email</label>
			<Input
				id="invite-email"
				type="email"
				bind:value={inviteEmail}
				placeholder="jane@example.com"
				required
			/>
		</div>
		<div>
			<label class="mb-1 block text-sm font-medium" for="invite-role">Role</label>
			<select
				id="invite-role"
				class="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
				bind:value={inviteRole}
			>
				<option value="user">user</option>
				<option value="admin">admin</option>
			</select>
		</div>
	</div>
	{#snippet footer()}
		<Button
			variant="ghost"
			tone="neutral"
			onclick={() => (inviteOpen = false)}
			disabled={inviteSaving}
		>
			Cancel
		</Button>
		<Button
			loading={inviteSaving}
			disabled={!inviteName.trim() || !inviteEmail.trim()}
			onclick={submitInvite}
		>
			Invite
		</Button>
	{/snippet}
</Dialog>
