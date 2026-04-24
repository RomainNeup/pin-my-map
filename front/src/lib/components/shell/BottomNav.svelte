<script lang="ts">
	import { page } from '$app/stores';
	import Map from 'lucide-svelte/icons/map';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import Plus from 'lucide-svelte/icons/plus';
	import Search from 'lucide-svelte/icons/search';
	import User from 'lucide-svelte/icons/user';
	import { twMerge } from 'tailwind-merge';
	import UserMenu from './UserMenu.svelte';

	const isActive = (path: string) => $page.url.pathname === path;

	const itemCls = (active: boolean) =>
		twMerge(
			'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
			active ? 'text-accent' : 'text-fg-muted hover:text-fg'
		);
</script>

<nav
	class="glass fixed inset-x-0 bottom-0 z-overlay flex items-stretch border-t md:hidden"
	style="padding-bottom: env(safe-area-inset-bottom, 0px);"
>
	<a href="/" class={itemCls(isActive('/'))}>
		<Map class="h-5 w-5" />
		Map
	</a>
	<a href="/saved/list" class={itemCls(isActive('/saved/list'))}>
		<Bookmark class="h-5 w-5" />
		Saved
	</a>
	<div class="flex items-center justify-center px-2">
		<a
			href="/place/create"
			class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-md"
			aria-label="Add place"
		>
			<Plus class="h-5 w-5" />
		</a>
	</div>
	<a href="/place/search" class={itemCls(isActive('/place/search'))}>
		<Search class="h-5 w-5" />
		Search
	</a>
	<UserMenu placement="top-end" class="flex-1">
		{#snippet trigger({ toggle, open })}
			<button
				type="button"
				class={twMerge(
					'flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
					open ? 'text-accent' : 'text-fg-muted hover:text-fg'
				)}
				onclick={toggle}
				aria-label="Open menu"
				aria-expanded={open}
			>
				<User class="h-5 w-5" />
				You
			</button>
		{/snippet}
	</UserMenu>
</nav>
