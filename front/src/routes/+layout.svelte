<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import '../app.css';
	import { accessToken, currentUser } from '$lib/stores/user';
	import { loadGamificationProfile, resetGamification } from '$lib/stores/gamification';
	import { getMe } from '$lib/api/auth';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let { children } = $props();

	const AUTH_ROUTES = ['/login', '/register'];
	const STYLEGUIDE_ROUTES = ['/__styleguide'];
	const FULLSCREEN_ROUTES = ['/place/pick'];

	const pathname = $derived($page.url.pathname);
	const isAuth = $derived(AUTH_ROUTES.some((p) => pathname.startsWith(p)));
	const isStyleguide = $derived(STYLEGUIDE_ROUTES.some((p) => pathname.startsWith(p)));
	const isFullscreen = $derived(FULLSCREEN_ROUTES.some((p) => pathname.startsWith(p)));
	const skipShell = $derived(isAuth || isStyleguide || isFullscreen);

	onMount(() => {
		if (!$accessToken && !AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
			goto('/login');
		}
	});

	$effect(() => {
		if ($accessToken && !$currentUser) {
			getMe().catch(() => {
				// 401 interceptor already clears the token
			});
		}
	});

	$effect(() => {
		if ($currentUser) {
			loadGamificationProfile({ silent: true }).catch(() => {});
		} else {
			resetGamification();
		}
	});
</script>

{#if skipShell}
	{@render children()}
	<Toast />
	<ConfirmDialog />
{:else}
	<AppShell>
		{@render children()}
	</AppShell>
{/if}
