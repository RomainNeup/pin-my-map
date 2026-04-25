<script lang="ts">
	import { page } from '$app/stores';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { twMerge } from 'tailwind-merge';
	import UserMenu from './UserMenu.svelte';

	interface AppHeaderProps {
		transparent?: boolean;
	}

	const { transparent = false }: AppHeaderProps = $props();

	const isActive = (path: string) => $page.url.pathname === path;

	const navLink = (active: boolean) =>
		twMerge(
			'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
			active ? 'bg-bg-muted text-fg' : 'text-fg-muted hover:bg-bg-muted hover:text-fg'
		);
</script>

<header
	class={twMerge(
		'sticky top-0 z-overlay hidden h-14 items-center gap-2 border-b px-3 md:flex md:px-6',
		transparent ? 'glass border-transparent' : 'border-border bg-bg-elevated'
	)}
>
	<a href="/" class="flex items-center gap-2 font-semibold text-fg">
		<span
			class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg shadow-sm"
		>
			<MapPin class="h-4 w-4" />
		</span>
		<span class="hidden sm:inline">pin my map</span>
	</a>

	<nav class="ml-4 hidden items-center gap-1 md:flex">
		<a href="/" class={navLink(isActive('/'))}>Map</a>
		<a href="/profile" class={navLink(isActive('/profile'))}>Profile</a>
		<a href="/discover" class={navLink(isActive('/discover'))}>Discover</a>
	</nav>

	<div class="ml-auto flex items-center gap-2">
		<UserMenu />
	</div>
</header>
