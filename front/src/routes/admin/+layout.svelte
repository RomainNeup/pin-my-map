<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentUser, accessToken } from '$lib/stores/user';
	import { listConflicts } from '$lib/api/place';
	import { onMount } from 'svelte';

	let { children } = $props();

	const pathname = $derived($page.url.pathname);

	let conflictCount = $state(0);

	$effect(() => {
		if (!$accessToken) {
			goto('/login');
			return;
		}
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	onMount(async () => {
		if ($currentUser?.role === 'admin') {
			try {
				const page = await listConflicts({ limit: 1 });
				conflictCount = page.total;
			} catch {
				// non-blocking — badge just stays 0
			}
		}
	});

	const tabs = [
		{ href: '/admin/suggestions', label: 'Suggestions' },
		{ href: '/admin/users', label: 'Users' },
		{ href: '/admin/audit', label: 'Audit log' },
		{ href: '/admin/conflicts', label: 'Conflicts', badge: true }
	];
</script>

{#if $currentUser?.role === 'admin'}
	<div class="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
		<header class="space-y-1">
			<h1 class="text-2xl font-semibold">Admin panel</h1>
			<p class="text-sm text-fg-muted">
				Moderate place suggestions, manage users, review activity.
			</p>
		</header>
		<nav class="flex gap-1 border-b border-border">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors"
					class:border-accent={pathname.startsWith(tab.href)}
					class:text-accent={pathname.startsWith(tab.href)}
					class:border-transparent={!pathname.startsWith(tab.href)}
					class:text-fg-muted={!pathname.startsWith(tab.href)}
				>
					{tab.label}
					{#if tab.badge && conflictCount > 0}
						<span
							class="rounded-full bg-orange-500 px-1.5 py-0.5 text-xs font-semibold text-white"
						>
							{conflictCount}
						</span>
					{/if}
				</a>
			{/each}
		</nav>
		{@render children()}
	</div>
{:else}
	<div class="flex h-[50vh] items-center justify-center text-sm text-fg-muted">Loading…</div>
{/if}
