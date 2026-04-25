<script lang="ts">
	import { onMount } from 'svelte';
	import { listMyFollowers, listMyFollowing } from '$lib/api/follow';
	import type { UserStats } from '$lib/api/gamification';

	interface Props {
		stats: UserStats | null;
	}

	const { stats }: Props = $props();

	let followerCount = $state<number | null>(null);
	let followingCount = $state<number | null>(null);

	onMount(async () => {
		try {
			const [followers, following] = await Promise.all([listMyFollowers(), listMyFollowing()]);
			followerCount = followers.length;
			followingCount = following.length;
		} catch {
			// handled by interceptor
		}
	});

	interface StatItem {
		label: string;
		value: number | null;
	}

	const items = $derived<StatItem[]>([
		{ label: 'Saved places', value: stats?.savedCount ?? null },
		{ label: 'Done', value: stats?.doneCount ?? null },
		{ label: 'Tags created', value: stats?.tagsCreated ?? null },
		{ label: 'Suggestions', value: stats?.suggestionsSubmitted ?? null },
		{ label: 'Followers', value: followerCount },
		{ label: 'Following', value: followingCount }
	]);
</script>

<section>
	<h2 class="mb-3 text-lg font-semibold">Stats</h2>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each items as item (item.label)}
			<div class="rounded-lg border border-border bg-bg p-3">
				<p class="text-xs text-fg-muted">{item.label}</p>
				<p class="text-2xl font-semibold">
					{#if item.value === null}
						<span class="h-7 w-10 animate-pulse rounded bg-bg-muted inline-block align-middle"></span>
					{:else}
						{item.value}
					{/if}
				</p>
			</div>
		{/each}
	</div>
</section>
