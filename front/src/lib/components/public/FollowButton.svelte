<script lang="ts">
	import {
		followUser,
		getFollowStats,
		unfollowUser,
		type FollowStats
	} from '$lib/api/follow';
	import { currentUser } from '$lib/stores/user';
	import Button from '$lib/components/Button.svelte';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import UserCheck from 'lucide-svelte/icons/user-check';

	type Props = { userId: string };
	let { userId }: Props = $props();

	let stats = $state<FollowStats | null>(null);
	let busy = $state(false);

	const refresh = async () => {
		if (!$currentUser || $currentUser.id === userId) return;
		try {
			stats = await getFollowStats(userId);
		} catch {
			stats = null;
		}
	};

	$effect(() => {
		if ($currentUser?.id) {
			refresh();
		} else {
			stats = null;
		}
	});

	const toggle = async () => {
		if (!stats) return;
		busy = true;
		try {
			stats = stats.isFollowing ? await unfollowUser(userId) : await followUser(userId);
		} finally {
			busy = false;
		}
	};

	const isMe = $derived($currentUser?.id === userId);
</script>

{#if stats && !isMe}
	<div class="flex items-center gap-3">
		<span class="text-sm text-fg-muted">
			{stats.followerCount} follower{stats.followerCount === 1 ? '' : 's'}
		</span>
		<Button
			variant={stats.isFollowing ? 'outline' : 'solid'}
			tone="accent"
			loading={busy}
			onclick={toggle}
		>
			{#if stats.isFollowing}
				<UserCheck class="h-4 w-4" /> Following
			{:else}
				<UserPlus class="h-4 w-4" /> Follow
			{/if}
		</Button>
	</div>
{:else if stats && isMe}
	<span class="text-sm text-fg-muted">
		{stats.followerCount} follower{stats.followerCount === 1 ? '' : 's'}
	</span>
{/if}
