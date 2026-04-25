<script lang="ts">
	import { onMount } from 'svelte';
	import Trophy from 'lucide-svelte/icons/trophy';
	import Lock from 'lucide-svelte/icons/lock';
	import { gamificationProfile, loadGamificationProfile } from '$lib/stores/gamification';
	import { currentUser } from '$lib/stores/user';
	import { listMine, type Suggestion } from '$lib/api/suggestion';

	let mySuggestions = $state<Suggestion[]>([]);
	let suggestionsLoading = $state(false);

	onMount(() => {
		loadGamificationProfile({ silent: true }).catch(() => {});
		suggestionsLoading = true;
		listMine()
			.then((data) => {
				mySuggestions = data;
			})
			.catch(() => {})
			.finally(() => {
				suggestionsLoading = false;
			});
	});

	const stats = $derived($gamificationProfile?.stats);
	const achievements = $derived($gamificationProfile?.achievements ?? []);
	const unlocked = $derived(achievements.filter((a) => a.unlocked));
	const locked = $derived(achievements.filter((a) => !a.unlocked));
</script>

<div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
	<header class="flex items-start gap-4">
		<div
			class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
		>
			<Trophy class="h-8 w-8" />
		</div>
		<div class="flex-1">
			<h1 class="text-2xl font-semibold">{$currentUser?.name ?? 'Your profile'}</h1>
			{#if $gamificationProfile}
				<p class="text-sm text-fg-muted">
					Level {$gamificationProfile.level} · {$gamificationProfile.points} points
				</p>
				<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
					<div
						class="h-full rounded-full bg-accent transition-all"
						style="width: {Math.round($gamificationProfile.progress * 100)}%"
					></div>
				</div>
				<p class="mt-1 text-xs text-fg-muted">
					{$gamificationProfile.pointsInLevel} / {$gamificationProfile.pointsForNextLevel}
					to level {$gamificationProfile.level + 1}
				</p>
			{:else}
				<p class="text-sm text-fg-muted">Loading…</p>
			{/if}
		</div>
	</header>

	{#if stats}
		<section>
			<h2 class="mb-3 text-lg font-semibold">Stats</h2>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Saved places</p>
					<p class="text-2xl font-semibold">{stats.savedCount}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Visited (done)</p>
					<p class="text-2xl font-semibold">{stats.doneCount}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Ratings</p>
					<p class="text-2xl font-semibold">{stats.ratedCount}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">5-star ratings</p>
					<p class="text-2xl font-semibold">{stats.fiveStarCount}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Comments</p>
					<p class="text-2xl font-semibold">{stats.commentedCount}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Tags created</p>
					<p class="text-2xl font-semibold">{stats.tagsCreated}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Places created</p>
					<p class="text-2xl font-semibold">{stats.placesCreated}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Suggestions</p>
					<p class="text-2xl font-semibold">{stats.suggestionsSubmitted}</p>
				</div>
				<div class="rounded-lg border border-border bg-bg p-3">
					<p class="text-xs text-fg-muted">Tags applied</p>
					<p class="text-2xl font-semibold">{stats.uniqueTagsApplied}</p>
				</div>
			</div>
		</section>
	{/if}

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

	<!-- My suggestions -->
	<section>
		<h2 class="mb-3 text-lg font-semibold">My suggestions</h2>

		{#if suggestionsLoading}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else if mySuggestions.length === 0}
			<p class="text-sm text-fg-muted">You haven't submitted any suggestions yet.</p>
		{:else}
			<ul class="space-y-3">
				{#each mySuggestions as s (s.id)}
					<li class="rounded-lg border border-border bg-bg p-3">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div class="flex-1">
								<p class="text-sm font-medium">
									{s.place?.name ?? `Place ${s.placeId}`}
								</p>
								<p class="text-xs text-fg-muted">
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
						{#if s.status === 'rejected' && s.reviewReason}
							<p class="mt-1 text-xs text-fg-muted">Reason: {s.reviewReason}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
