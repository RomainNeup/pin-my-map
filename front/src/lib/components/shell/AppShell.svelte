<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import AppHeader from './AppHeader.svelte';
	import BottomNav from './BottomNav.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	interface AppShellProps {
		children: Snippet;
	}

	const { children }: AppShellProps = $props();

	const isHome = $derived($page.url.pathname === '/');
</script>

<div class="flex min-h-dvh flex-col bg-bg text-fg">
	<AppHeader transparent={isHome} />
	<main class="flex-1 pb-(--tabbar-h) md:pb-0 {isHome ? 'md:-mt-14' : ''}">
		{@render children()}
	</main>
	<BottomNav />
</div>

<Toast />
<ConfirmDialog />
