<script lang="ts">
	import { onMount } from 'svelte';
	import {
		discoverPublicMaps,
		getFollowingPublicMaps,
		type PublicMapSummary
	} from '$lib/api/publicMap';
	import { currentUser } from '$lib/stores/user';
	import Input from '$lib/components/Input.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import UserSearch from '$lib/components/user/UserSearch.svelte';
	import Globe from 'lucide-svelte/icons/globe';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Star from 'lucide-svelte/icons/star';
	import UserCheck from 'lucide-svelte/icons/user-check';
	import Search from 'lucide-svelte/icons/search';
	import UserX from 'lucide-svelte/icons/user-x';

	type Tab = 'discover' | 'following';
	let activeTab = $state<Tab>('discover');

	let query = $state('');
	let discoverResults = $state<PublicMapSummary[]>([]);
	let followingResults = $state<PublicMapSummary[]>([]);
	let loadingDiscover = $state(false);
	let loadingFollowing = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	const searchDiscover = async () => {
		const id = ++requestId;
		loadingDiscover = true;
		try {
			const r = await discoverPublicMaps(query);
			if (id !== requestId) return;
			discoverResults = r;
		} finally {
			if (id === requestId) loadingDiscover = false;
		}
	};

	const loadFollowing = async () => {
		loadingFollowing = true;
		try {
			followingResults = await getFollowingPublicMaps();
		} catch {
			followingResults = [];
		} finally {
			loadingFollowing = false;
		}
	};

	const onInput = () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(searchDiscover, 250);
	};

	const switchTab = (tab: Tab) => {
		activeTab = tab;
		if (tab === 'following' && followingResults.length === 0 && !loadingFollowing) {
			loadFollowing();
		}
	};

	onMount(searchDiscover);
</script>

<div class="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
	<header>
		<h1 class="text-2xl font-semibold text-fg">Discover public maps</h1>
		<p class="text-sm text-fg-muted">Find what other explorers have pinned.</p>
	</header>

	<section class="space-y-2">
		<h2 class="text-sm font-medium text-fg-muted">Find a user</h2>
		<UserSearch />
	</section>

	<!-- Tabs -->
	<div class="flex gap-1 rounded-lg border border-border bg-bg-elevated p-1">
		<button
			class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition {activeTab ===
			'discover'
				? 'bg-accent text-accent-fg'
				: 'text-fg-muted hover:text-fg'}"
			onclick={() => switchTab('discover')}
		>
			<Globe class="h-4 w-4" />
			Discover
		</button>
		{#if $currentUser}
			<button
				class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition {activeTab ===
				'following'
					? 'bg-accent text-accent-fg'
					: 'text-fg-muted hover:text-fg'}"
				onclick={() => switchTab('following')}
			>
				<UserCheck class="h-4 w-4" />
				Following
			</button>
		{/if}
	</div>

	<!-- Discover tab -->
	{#if activeTab === 'discover'}
		<Input bind:value={query} placeholder="Search by name or slug…" {onInput} />

		{#if loadingDiscover && discoverResults.length === 0}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else if discoverResults.length === 0}
			{#snippet discoverEmptyIcon()}<Search class="h-5 w-5" />{/snippet}
			<EmptyState
				title="No public maps found"
				description={query ? 'Try a different search term.' : 'Be the first to make your map public!'}
				icon={discoverEmptyIcon}
			/>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each discoverResults as map (map.userId)}
					<li class="rounded-xl border border-border bg-bg-elevated p-4 transition hover:border-accent">
						<a href={`/u/${map.publicSlug}`} class="block space-y-2">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2 overflow-hidden">
									<Globe class="h-4 w-4 shrink-0 text-accent" />
									<h3 class="truncate font-semibold text-fg">{map.name}</h3>
								</div>
								{#if map.level !== undefined}
									<span
										class="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent"
									>
										<Star class="h-3 w-3" />
										Lv {map.level}
									</span>
								{/if}
							</div>
							<p class="text-xs text-fg-muted">/u/{map.publicSlug}</p>
							<div class="flex items-center gap-3 text-xs text-fg-muted">
								<span class="inline-flex items-center gap-1">
									<MapPin class="h-3 w-3" />
									{map.savedCount} place{map.savedCount === 1 ? '' : 's'}
								</span>
								<span class="inline-flex items-center gap-1">
									<Users class="h-3 w-3" />
									{map.followerCount} follower{map.followerCount === 1 ? '' : 's'}
								</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}

	<!-- Following tab -->
	{#if activeTab === 'following'}
		{#if loadingFollowing}
			<p class="text-sm text-fg-muted">Loading…</p>
		{:else if followingResults.length === 0}
			{#snippet followingEmptyIcon()}<UserX class="h-5 w-5" />{/snippet}
			<EmptyState
				title="No maps yet"
				description="Follow some explorers to see their public maps here."
				icon={followingEmptyIcon}
			/>
		{:else}
			<ul class="grid gap-3 sm:grid-cols-2">
				{#each followingResults as map (map.userId)}
					<li class="rounded-xl border border-border bg-bg-elevated p-4 transition hover:border-accent">
						<a href={`/u/${map.publicSlug}`} class="block space-y-2">
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2 overflow-hidden">
									<Globe class="h-4 w-4 shrink-0 text-accent" />
									<h3 class="truncate font-semibold text-fg">{map.name}</h3>
								</div>
								{#if map.level !== undefined}
									<span
										class="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent"
									>
										<Star class="h-3 w-3" />
										Lv {map.level}
									</span>
								{/if}
							</div>
							<p class="text-xs text-fg-muted">/u/{map.publicSlug}</p>
							<div class="flex items-center gap-3 text-xs text-fg-muted">
								<span class="inline-flex items-center gap-1">
									<MapPin class="h-3 w-3" />
									{map.savedCount} place{map.savedCount === 1 ? '' : 's'}
								</span>
								<span class="inline-flex items-center gap-1">
									<Users class="h-3 w-3" />
									{map.followerCount} follower{map.followerCount === 1 ? '' : 's'}
								</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
