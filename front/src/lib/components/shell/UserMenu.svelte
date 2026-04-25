<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import Tag from 'lucide-svelte/icons/tag';
	import Globe from 'lucide-svelte/icons/globe';
	import Compass from 'lucide-svelte/icons/compass';
	import Users from 'lucide-svelte/icons/users';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Shield from 'lucide-svelte/icons/shield';
	import Trophy from 'lucide-svelte/icons/trophy';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { theme, type ThemeMode } from '$lib/stores/theme';
	import { accessToken, currentUser, isAdmin } from '$lib/stores/user';
	import { gamificationProfile } from '$lib/stores/gamification';

	interface UserMenuProps {
		placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
		trigger?: Snippet<[{ toggle: () => void; open: boolean }]>;
		class?: string;
	}

	const { placement = 'bottom-end', trigger, class: className = '' }: UserMenuProps = $props();

	let open = $state(false);
	let triggerEl = $state<HTMLElement | null>(null);

	const toggle = () => (open = !open);

	const setTheme = (mode: ThemeMode) => {
		theme.set(mode);
		open = false;
	};

	const logout = () => {
		accessToken.set(null);
		open = false;
		goto('/login');
	};

	const name = $derived($currentUser?.name ?? 'You');
</script>

<div class="relative {className}" bind:this={triggerEl}>
	{#if trigger}
		{@render trigger({ toggle, open })}
	{:else}
		<button
			type="button"
			class="flex items-center rounded-full focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			onclick={toggle}
			aria-label="Open menu"
			aria-expanded={open}
		>
			<Avatar {name} size="md" />
		</button>
	{/if}
	<Popover bind:open anchor={triggerEl} {placement}>
		{#if $gamificationProfile}
			<a
				href="/profile"
				class="block rounded-md px-2 py-2 hover:bg-bg-muted"
				onclick={() => (open = false)}
			>
				<div class="flex items-center gap-2">
					<Trophy class="h-4 w-4 text-accent" />
					<span class="text-sm font-medium">Level {$gamificationProfile.level}</span>
					<span class="ml-auto text-xs text-fg-muted">{$gamificationProfile.points} pts</span>
				</div>
				<div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
					<div
						class="h-full rounded-full bg-accent transition-all"
						style="width: {Math.round($gamificationProfile.progress * 100)}%"
					></div>
				</div>
				<p class="mt-1 text-[11px] text-fg-muted">
					{$gamificationProfile.pointsInLevel}/{$gamificationProfile.pointsForNextLevel} to next level
				</p>
			</a>
			<hr class="my-1 border-border" />
		{/if}
		<div class="px-1 pb-1">
			<p class="px-2 pb-1 pt-1 text-xs font-medium text-fg-muted">Theme</p>
			<button
				class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
				onclick={() => setTheme('light')}
			>
				<Sun class="h-4 w-4" /> Light
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
				onclick={() => setTheme('dark')}
			>
				<Moon class="h-4 w-4" /> Dark
			</button>
			<button
				class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
				onclick={() => setTheme('system')}
			>
				<Monitor class="h-4 w-4" /> System
			</button>
		</div>
		<hr class="my-1 border-border" />
		<a
			href="/profile?tab=saved"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Bookmark class="h-4 w-4" /> My saved places
		</a>
		<a
			href="/profile?tab=tags"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Tag class="h-4 w-4" /> My tags
		</a>
		<a
			href="/profile?tab=public-map"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Globe class="h-4 w-4" /> Public map
		</a>
		<a
			href="/discover"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Compass class="h-4 w-4" /> Discover
		</a>
		<a
			href="/profile?tab=following"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Users class="h-4 w-4" /> Following
		</a>
		{#if $isAdmin}
			<hr class="my-1 border-border" />
			<a
				href="/admin/suggestions"
				class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
				onclick={() => (open = false)}
			>
				<Shield class="h-4 w-4" /> Admin panel
			</a>
		{/if}
		<button
			class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger hover:bg-danger-soft"
			onclick={logout}
		>
			<LogOut class="h-4 w-4" /> Log out
		</button>
	</Popover>
</div>
