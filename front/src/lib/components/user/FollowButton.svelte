<script lang="ts">
	import { followUser, isFollowing, unfollowUser } from '$lib/api/follow';
	import { currentUser } from '$lib/stores/user';
	import Button from '$lib/components/Button.svelte';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import UserCheck from 'lucide-svelte/icons/user-check';

	type Props = { userId: string };
	let { userId }: Props = $props();

	let following = $state<boolean | null>(null);
	let busy = $state(false);

	const refresh = async () => {
		if (!$currentUser || $currentUser.id === userId) {
			following = null;
			return;
		}
		try {
			const result = await isFollowing(userId);
			following = result.following;
		} catch {
			following = null;
		}
	};

	$effect(() => {
		if ($currentUser?.id) {
			refresh();
		} else {
			following = null;
		}
	});

	const toggle = async () => {
		if (following === null) return;
		busy = true;
		try {
			if (following) {
				await unfollowUser(userId);
				following = false;
			} else {
				await followUser(userId);
				following = true;
			}
		} finally {
			busy = false;
		}
	};

	const isMe = $derived($currentUser?.id === userId);
</script>

{#if following !== null && !isMe}
	<Button
		variant={following ? 'outline' : 'solid'}
		tone="accent"
		size="sm"
		loading={busy}
		onclick={toggle}
	>
		{#if following}
			<UserCheck class="h-4 w-4" /> Following
		{:else}
			<UserPlus class="h-4 w-4" /> Follow
		{/if}
	</Button>
{/if}
