<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Lock from 'lucide-svelte/icons/lock';
	import Globe from 'lucide-svelte/icons/globe';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Check from 'lucide-svelte/icons/check';
	import X from 'lucide-svelte/icons/x';
	import { gamificationProfile, loadGamificationProfile } from '$lib/stores/gamification';
	import { currentUser } from '$lib/stores/user';
	import { listMine, type Suggestion } from '$lib/api/suggestion';
	import { updateMe } from '$lib/api/user';
	import { toast } from '$lib/stores/toast';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import IdentityCard from '$lib/components/profile/IdentityCard.svelte';
	import StatsSummary from '$lib/components/profile/StatsSummary.svelte';
	import DangerZone from '$lib/components/profile/DangerZone.svelte';
	import MyTagsSection from '$lib/components/profile/MyTagsSection.svelte';
	import MySavedSection from '$lib/components/profile/MySavedSection.svelte';
	import PublicMapSection from '$lib/components/profile/PublicMapSection.svelte';
	import FollowingSection from '$lib/components/profile/FollowingSection.svelte';

	type TabId = 'profile' | 'tags' | 'saved' | 'public-map' | 'following' | 'suggestions';

	const TABS: { id: TabId; label: string }[] = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'tags', label: 'My tags' },
		{ id: 'saved', label: 'My saved places' },
		{ id: 'public-map', label: 'Public map' },
		{ id: 'following', label: 'Following' },
		{ id: 'suggestions', label: 'My suggestions' }
	];

	let activeTab = $state<TabId>('profile');

	// Sync tab from/to URL
	$effect(() => {
		const urlTab = $page.url.searchParams.get('tab') as TabId | null;
		if (urlTab && TABS.some((t) => t.id === urlTab)) {
			activeTab = urlTab;
		} else {
			activeTab = 'profile';
		}
	});

	function setTab(id: TabId) {
		const url = new URL($page.url);
		url.searchParams.set('tab', id);
		goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	}

	// ── load gamification ──────────────────────────────────────────────
	onMount(async () => {
		loadGamificationProfile({ silent: true }).catch(() => {});
		loadMySuggestions();
	});

	// ── derived ───────────────────────────────────────────────────────
	const achievements = $derived($gamificationProfile?.achievements ?? []);
	const unlocked = $derived(achievements.filter((a) => a.unlocked));
	const locked = $derived(achievements.filter((a) => !a.unlocked));

	// ── edit name ─────────────────────────────────────────────────────
	let editingName = $state(false);
	let nameValue = $state('');
	let nameSaving = $state(false);

	const startEditName = () => {
		nameValue = $currentUser?.name ?? '';
		editingName = true;
	};

	const cancelEditName = () => {
		editingName = false;
		nameValue = '';
	};

	const saveName = async () => {
		if (!nameValue.trim() || nameValue.trim() === $currentUser?.name) {
			cancelEditName();
			return;
		}
		nameSaving = true;
		try {
			const updated = await updateMe({ name: nameValue.trim() });
			currentUser.update((u) => (u ? { ...u, name: updated.name } : u));
			toast('Name updated.', 'success');
			editingName = false;
		} catch {
			toast('Failed to update name.', 'error');
		} finally {
			nameSaving = false;
		}
	};

	// ── edit email ────────────────────────────────────────────────────
	let emailFormOpen = $state(false);
	let emailValue = $state('');
	let emailPassword = $state('');
	let emailSaving = $state(false);
	let emailError = $state('');

	const openEmailForm = () => {
		emailValue = $currentUser?.email ?? '';
		emailPassword = '';
		emailError = '';
		emailFormOpen = true;
	};

	const cancelEmailForm = () => {
		emailFormOpen = false;
		emailValue = '';
		emailPassword = '';
		emailError = '';
	};

	const saveEmail = async () => {
		emailError = '';
		emailSaving = true;
		try {
			const updated = await updateMe({ email: emailValue.trim(), currentPassword: emailPassword });
			currentUser.update((u) => (u ? { ...u, email: updated.email } : u));
			toast('Email updated.', 'success');
			cancelEmailForm();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status;
			if (status === 401) emailError = 'Password is incorrect.';
			else if (status === 409) emailError = 'This email is already taken.';
			else emailError = 'Failed to update email.';
		} finally {
			emailSaving = false;
		}
	};

	// ── my suggestions ────────────────────────────────────────────────
	let mySuggestions = $state<Suggestion[]>([]);
	let suggestionsLoading = $state(false);

	const loadMySuggestions = async () => {
		suggestionsLoading = true;
		try {
			mySuggestions = await listMine();
		} catch {
			// silently ignored
		} finally {
			suggestionsLoading = false;
		}
	};

	const statusLabel: Record<string, string> = {
		pending: 'Pending',
		approved: 'Approved',
		rejected: 'Rejected'
	};

	const statusCls: Record<string, string> = {
		pending: 'bg-bg-muted text-fg-muted',
		approved: 'bg-accent-soft text-accent',
		rejected: 'bg-danger-soft text-danger'
	};
</script>

<div class="mx-auto max-w-4xl px-4 py-4 sm:px-6">
	<!-- Tab bar -->
	<div class="mb-6 overflow-x-auto">
		<div class="flex min-w-max gap-1 rounded-xl border border-border bg-bg-elevated p-1">
			{#each TABS as t (t.id)}
				<button
					type="button"
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap {activeTab === t.id
						? 'bg-accent text-accent-fg shadow-sm'
						: 'text-fg-muted hover:text-fg'}"
					onclick={() => setTab(t.id)}
					aria-pressed={activeTab === t.id}
				>
					{t.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Profile tab -->
	{#if activeTab === 'profile'}
		<div class="space-y-6">
			{#if $currentUser}
				<IdentityCard user={$currentUser} profile={$gamificationProfile} />
			{/if}

			<section class="rounded-xl border border-border bg-bg p-5">
				<h2 class="mb-4 text-lg font-semibold">Profile</h2>

				<!-- Name -->
				<div class="mb-4">
					<p class="mb-1 text-xs font-medium text-fg-muted">Display name</p>
					{#if editingName}
						<div class="flex items-center gap-2">
							<Input bind:value={nameValue} placeholder="Your name" class="max-w-xs" />
							<Button
								variant="ghost"
								tone="accent"
								size="sm"
								onclick={saveName}
								loading={nameSaving}
								ariaLabel="Save name"
							>
								{#snippet prefix()}<Check class="h-4 w-4" />{/snippet}
								Save
							</Button>
							<Button
								variant="ghost"
								tone="neutral"
								size="sm"
								onclick={cancelEditName}
								ariaLabel="Cancel"
							>
								{#snippet prefix()}<X class="h-4 w-4" />{/snippet}
								Cancel
							</Button>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium">{$currentUser?.name}</span>
							<Button
								variant="ghost"
								tone="neutral"
								size="sm"
								onclick={startEditName}
								ariaLabel="Edit name"
							>
								{#snippet prefix()}<Pencil class="h-3.5 w-3.5" />{/snippet}
								Edit
							</Button>
						</div>
					{/if}
				</div>

				<!-- Email -->
				<div>
					<div class="flex items-center justify-between">
						<div>
							<p class="text-xs font-medium text-fg-muted">Email</p>
							<p class="text-sm font-medium">{$currentUser?.email}</p>
						</div>
						{#if !emailFormOpen}
							<Button variant="outline" tone="neutral" size="sm" onclick={openEmailForm}>
								{#snippet prefix()}<Pencil class="h-3.5 w-3.5" />{/snippet}
								Change
							</Button>
						{/if}
					</div>

					{#if emailFormOpen}
						<form
							class="mt-3 space-y-3"
							onsubmit={(e) => {
								e.preventDefault();
								saveEmail();
							}}
						>
							<div>
								<label class="mb-1 block text-xs font-medium" for="email-new">New email</label>
								<Input
									id="email-new"
									bind:value={emailValue}
									type="email"
									required
									autocomplete="email"
								/>
							</div>
							<div>
								<label class="mb-1 block text-xs font-medium" for="email-password"
									>Current password</label
								>
								<Input
									id="email-password"
									bind:value={emailPassword}
									type="password"
									required
									autocomplete="current-password"
									error={emailError === 'Password is incorrect.'}
								/>
							</div>
							{#if emailError}
								<p class="text-sm text-danger">{emailError}</p>
							{/if}
							<div class="flex gap-2">
								<Button type="submit" tone="accent" loading={emailSaving}>Save email</Button>
								<Button variant="ghost" tone="neutral" onclick={cancelEmailForm}>Cancel</Button>
							</div>
						</form>
					{/if}
				</div>
			</section>

			<StatsSummary stats={$gamificationProfile?.stats ?? null} />

			<!-- Achievements -->
			{#if achievements.length > 0}
				<section>
					<h2 class="mb-3 text-lg font-semibold">
						Achievements <span class="text-sm font-normal text-fg-muted"
							>({unlocked.length}/{achievements.length})</span
						>
					</h2>

					{#if unlocked.length > 0}
						<h3 class="mb-2 text-sm font-medium text-fg-muted">Unlocked</h3>
						<div class="mb-4 grid gap-2 sm:grid-cols-2">
							{#each unlocked as ach (ach.id)}
								<div class="flex items-start gap-3 rounded-lg border border-border bg-bg p-3">
									<span class="text-2xl">{ach.icon}</span>
									<div class="flex-1">
										<p class="text-sm font-medium">{ach.name}</p>
										<p class="text-xs text-fg-muted">{ach.description}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if locked.length > 0}
						<h3 class="mb-2 text-sm font-medium text-fg-muted">In progress</h3>
						<div class="grid gap-2 sm:grid-cols-2">
							{#each locked as ach (ach.id)}
								<div
									class="flex items-start gap-3 rounded-lg border border-border bg-bg-muted p-3 opacity-80"
								>
									<span class="text-2xl grayscale">{ach.icon}</span>
									<div class="flex-1">
										<div class="flex items-center gap-1">
											<Lock class="h-3 w-3 text-fg-muted" />
											<p class="text-sm font-medium">{ach.name}</p>
										</div>
										<p class="text-xs text-fg-muted">{ach.description}</p>
										<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
											<div
												class="bg-accent/60 h-full rounded-full"
												style="width: {Math.min(
													100,
													Math.round((ach.progress.current / ach.progress.target) * 100)
												)}%"
											></div>
										</div>
										<p class="mt-1 text-[11px] text-fg-muted">
											{ach.progress.current}/{ach.progress.target}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<DangerZone />
		</div>
	{/if}

	<!-- Tags tab -->
	{#if activeTab === 'tags'}
		<MyTagsSection />
	{/if}

	<!-- Saved tab -->
	{#if activeTab === 'saved'}
		<MySavedSection />
	{/if}

	<!-- Public map tab -->
	{#if activeTab === 'public-map'}
		<PublicMapSection />
	{/if}

	<!-- Following tab -->
	{#if activeTab === 'following'}
		<FollowingSection />
	{/if}

	<!-- Suggestions tab -->
	{#if activeTab === 'suggestions'}
		<section>
			{#if suggestionsLoading}
				<div class="space-y-2">
					{#each [1, 2] as i (i)}
						<div class="h-14 animate-pulse rounded-lg bg-bg-muted"></div>
					{/each}
				</div>
			{:else if mySuggestions.length === 0}
				<p class="py-8 text-center text-fg-muted">You haven't submitted any suggestions yet.</p>
			{:else}
				<div class="space-y-2">
					{#each mySuggestions as s (s.id)}
						<div class="flex items-start gap-3 rounded-lg border border-border bg-bg p-3">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{s.place?.name ?? s.placeId}</p>
								{#if s.note}
									<p class="truncate text-xs text-fg-muted">{s.note}</p>
								{/if}
							</div>
							<span
								class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusCls[s.status] ??
									'bg-bg-muted text-fg-muted'}"
							>
								{statusLabel[s.status] ?? s.status}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>
