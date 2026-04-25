<script lang="ts">
	import Trophy from 'lucide-svelte/icons/trophy';
	import Shield from 'lucide-svelte/icons/shield';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import type { CurrentUser } from '$lib/stores/user';
	import type { GamificationProfile } from '$lib/api/gamification';

	interface Props {
		user: CurrentUser;
		profile: GamificationProfile | null;
	}

	const { user, profile }: Props = $props();
</script>

<div class="flex items-start gap-4 rounded-xl border border-border bg-bg p-5">
	<Avatar name={user.name} size="lg" class="h-16 w-16 shrink-0 text-xl" />

	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="truncate text-2xl font-semibold">{user.name}</h1>
			{#if user.role === 'admin'}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
				>
					<Shield class="h-3 w-3" /> Admin
				</span>
			{/if}
		</div>
		<p class="text-sm text-fg-muted">{user.email}</p>

		{#if profile}
			<div class="mt-3 flex items-center gap-2">
				<Trophy class="h-4 w-4 shrink-0 text-accent" />
				<span class="text-sm font-medium">Level {profile.level}</span>
				<span class="text-xs text-fg-muted">{profile.points} pts</span>
			</div>
			<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
				<div
					class="h-full rounded-full bg-accent transition-all"
					style="width: {Math.round(profile.progress * 100)}%"
				></div>
			</div>
			<p class="mt-1 text-xs text-fg-muted">
				{profile.pointsInLevel} / {profile.pointsForNextLevel} to level {profile.level + 1}
			</p>
		{/if}
	</div>
</div>
