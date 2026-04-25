<script lang="ts">
	import { onMount } from 'svelte';
	import { listMyFollowers, listMyFollowing, type FollowUser } from '$lib/api/follow';
	import Globe from 'lucide-svelte/icons/globe';

	type Tab = 'following' | 'followers';

	let tab = $state<Tab>('following');
	let following = $state<FollowUser[]>([]);
	let followers = $state<FollowUser[]>([]);
	let loading = $state(false);

	const load = async () => {
		loading = true;
		try {
			const [fg, fr] = await Promise.all([listMyFollowing(), listMyFollowers()]);
			following = fg;
			followers = fr;
		} finally {
			loading = false;
		}
	};

	onMount(load);

	const list = $derived(tab === 'following' ? following : followers);
</script>

<div class="mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
	<header>
		<h1 class="text-2xl font-semibold text-fg">Connections</h1>
	</header>

	<div class="inline-flex rounded-lg border border-border bg-bg-elevated p-1">
		<button
			class="rounded-md px-3 py-1.5 text-sm {tab === 'following'
				? 'bg-accent text-accent-fg'
				: 'text-fg-muted'}"
			onclick={() => (tab = 'following')}
		>
			Following ({following.length})
		</button>
		<button
			class="rounded-md px-3 py-1.5 text-sm {tab === 'followers'
				? 'bg-accent text-accent-fg'
				: 'text-fg-muted'}"
			onclick={() => (tab = 'followers')}
		>
			Followers ({followers.length})
		</button>
	</div>

	{#if loading}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if list.length === 0}
		<p class="py-8 text-center text-fg-muted">
			{tab === 'following'
				? "You aren't following anyone yet. Visit /discover to find some maps."
				: 'No one follows you yet.'}
		</p>
	{:else}
		<ul class="space-y-2">
			{#each list as u}
				<li class="flex items-center justify-between rounded-lg border border-border bg-bg-elevated p-3">
					<div>
						<div class="font-medium text-fg">{u.name}</div>
						{#if u.publicSlug && u.isPublic}
							<div class="text-xs text-fg-muted">/u/{u.publicSlug}</div>
						{:else}
							<div class="text-xs text-fg-muted">Private map</div>
						{/if}
					</div>
					{#if u.publicSlug && u.isPublic}
						<a
							href={`/u/${u.publicSlug}`}
							class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
						>
							<Globe class="h-3 w-3" /> View
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
