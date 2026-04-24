<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import '../app.css';
	import { accessToken } from '$lib/stores/user';
	import AppShell from '$lib/components/shell/AppShell.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

	let { children } = $props();

	const AUTH_ROUTES = ['/login', '/register'];
	const STYLEGUIDE_ROUTES = ['/__styleguide'];

	const pathname = $derived($page.url.pathname);
	const isAuth = $derived(AUTH_ROUTES.some((p) => pathname.startsWith(p)));
	const isStyleguide = $derived(STYLEGUIDE_ROUTES.some((p) => pathname.startsWith(p)));
	const skipShell = $derived(isAuth || isStyleguide);

	onMount(() => {
		if (!$accessToken && !AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
			goto('/login');
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
