<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import '../app.css';
	import { accessToken, currentUser } from '$lib/stores/user';
	import { loadGamificationProfile, resetGamification } from '$lib/stores/gamification';
	import { loadTags } from '$lib/stores/tags';
	import { getMe } from '$lib/api/auth';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let { children } = $props();

	const AUTH_ROUTES = ['/login', '/register'];
	const FULLSCREEN_ROUTES = ['/place/pick'];

	const pathname = $derived($page.url.pathname);
	const isAuth = $derived(AUTH_ROUTES.some((p) => pathname.startsWith(p)));
	const isFullscreen = $derived(FULLSCREEN_ROUTES.some((p) => pathname.startsWith(p)));
	const skipShell = $derived(isAuth || isFullscreen);

	$effect(() => {
		if (!$accessToken && !AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
			goto('/login');
		}
	});

	let meTried = false;
	$effect(() => {
		const token = $accessToken;
		if (!token) {
			meTried = false;
			return;
		}
		if (!$currentUser && !meTried) {
			meTried = true;
			getMe()
				.then(() => {
					loadTags();
				})
				.catch(() => {
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
