<script lang="ts">
	import { page } from '$app/stores';
	import Map from 'lucide-svelte/icons/map';
	import Compass from 'lucide-svelte/icons/compass';
	import Plus from 'lucide-svelte/icons/plus';
	import { twMerge } from 'tailwind-merge';

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
	<div class="flex items-center justify-center px-2">
		<a
			href="/place/create"
			class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-md"
			aria-label="Add place"
		>
			<Plus class="h-5 w-5" />
		</a>
	</div>
	<a href="/discover" class={itemCls(isActive('/discover'))}>
		<Compass class="h-5 w-5" />
		Discover
	</a>
</nav>
