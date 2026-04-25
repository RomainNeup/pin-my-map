<script lang="ts">
	import { onMount } from 'svelte';
	import { listMyFollowers, listMyFollowing, unfollowUser, type FollowUser } from '$lib/api/follow';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Globe from 'lucide-svelte/icons/globe';
	import UserMinus from 'lucide-svelte/icons/user-minus';

	type Tab = 'following' | 'followers';

	let tab = $state<Tab>('following');
	let following = $state<FollowUser[]>([]);
	let followers = $state<FollowUser[]>([]);
	let loading = $state(false);
	let unfollowingId = $state<string | null>(null);

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

	const handleUnfollow = async (u: FollowUser) => {
		unfollowingId = u.userId;
		try {
			await unfollowUser(u.userId);
			following = following.filter((f) => f.userId !== u.userId);
		} finally {
			unfollowingId = null;
		}
	};
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
			{#each list as u (u.userId)}
				<li class="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated p-3">
					<Avatar name={u.name} size="md" />

					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="font-medium text-fg">{u.name}</span>
							{#if u.level != null}
								<span class="rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
									Lv {u.level}
								</span>
							{/if}
						</div>
						{#if u.publicSlug && u.isPublic}
							<div class="text-xs text-fg-muted">/u/{u.publicSlug}</div>
						{:else}
							<div class="text-xs text-fg-muted">Private map</div>
						{/if}
					</div>

					<div class="flex shrink-0 items-center gap-2">
						{#if u.publicSlug && u.isPublic}
							<a
								href={`/u/${u.publicSlug}`}
								class="inline-flex items-center gap-1 text-sm text-accent hover:underline"
							>
								<Globe class="h-3 w-3" /> View map
							</a>
						{/if}
						{#if tab === 'following'}
							<Button
								variant="outline"
								tone="neutral"
								size="sm"
								loading={unfollowingId === u.userId}
								onclick={() => handleUnfollow(u)}
							>
								<UserMinus class="h-4 w-4" /> Unfollow
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
