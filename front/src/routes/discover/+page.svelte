<script lang="ts">
	import { onMount } from 'svelte';
	import { discoverPublicMaps, type PublicMapSummary } from '$lib/api/publicMap';
	import Input from '$lib/components/Input.svelte';
	import UserSearch from '$lib/components/user/UserSearch.svelte';
	import Globe from 'lucide-svelte/icons/globe';
	import Users from 'lucide-svelte/icons/users';
	import MapPin from 'lucide-svelte/icons/map-pin';

	let query = $state('');
	let results = $state<PublicMapSummary[]>([]);
	let loading = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	const search = async () => {
		const id = ++requestId;
		loading = true;
		try {
			const r = await discoverPublicMaps(query);
			if (id !== requestId) return;
			results = r;
		} finally {
			if (id === requestId) loading = false;
		}
	};

	const onInput = () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(search, 250);
	};

	onMount(search);
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

	<Input bind:value={query} placeholder="Search by name or slug…" {onInput} />

	{#if loading && results.length === 0}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if results.length === 0}
		<p class="py-8 text-center text-fg-muted">
			No public maps found. {query ? 'Try a different search.' : ''}
		</p>
	{:else}
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each results as map}
				<li class="rounded-xl border border-border bg-bg-elevated p-4 transition hover:border-accent">
					<a href={`/u/${map.publicSlug}`} class="block space-y-2">
						<div class="flex items-center gap-2">
							<Globe class="h-4 w-4 text-accent" />
							<h3 class="font-semibold text-fg">{map.name}</h3>
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
</div>
