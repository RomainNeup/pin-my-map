<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import Popover from '$lib/components/ui/Popover.svelte';
	import { theme, type ThemeMode } from '$lib/stores/theme';
	import { accessToken } from '$lib/stores/user';

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

	const name = 'You';
</script>

<div class="relative {className}" bind:this={triggerEl}>
	{#if trigger}
		{@render trigger({ toggle, open })}
	{:else}
		<button
			type="button"
			class="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			onclick={toggle}
			aria-label="Open menu"
			aria-expanded={open}
		>
			<Avatar {name} size="md" />
		</button>
	{/if}
	<Popover bind:open anchor={triggerEl} {placement}>
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
			href="/saved/list"
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-muted"
			onclick={() => (open = false)}
		>
			<Bookmark class="h-4 w-4" /> My saved places
		</a>
		<button
			class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger hover:bg-danger-soft"
			onclick={logout}
		>
			<LogOut class="h-4 w-4" /> Log out
		</button>
	</Popover>
</div>
