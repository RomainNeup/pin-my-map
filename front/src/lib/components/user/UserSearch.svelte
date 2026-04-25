<script lang="ts">
	import { searchUsers, type PublicUserDto } from '$lib/api/user';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Search from 'lucide-svelte/icons/search';

	let query = $state('');
	let results = $state<PublicUserDto[]>([]);
	let loading = $state(false);
	let open = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let requestId = 0;

	const doSearch = async (q: string) => {
		const id = ++requestId;
		loading = true;
		try {
			const r = await searchUsers(q);
			if (id !== requestId) return;
			results = r;
			open = true;
		} catch {
			if (id === requestId) results = [];
		} finally {
			if (id === requestId) loading = false;
		}
	};

	const onInput = () => {
		if (timer) clearTimeout(timer);
		if (query.length < 2) {
			results = [];
			open = false;
			return;
		}
		timer = setTimeout(() => doSearch(query), 250);
	};

	const close = () => {
		open = false;
	};

	const userHref = (u: PublicUserDto) => (u.publicSlug ? `/u/${u.publicSlug}` : `/u/${u.id}`);
</script>

<div class="relative" use:clickOutside={close}>
	<div class="relative">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
		<input
			type="text"
			bind:value={query}
			oninput={onInput}
			placeholder="Search users…"
			autocomplete="off"
			class="h-9 w-full rounded-lg border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
		/>
	</div>

	{#if open && (results.length > 0 || loading)}
		<ul
			class="absolute left-0 top-full z-dropdown mt-1 w-full min-w-[220px] rounded-xl border border-border bg-bg-elevated py-1 shadow-lg"
		>
			{#if loading && results.length === 0}
				<li class="px-3 py-2 text-sm text-fg-muted">Searching…</li>
			{:else}
				{#each results as user (user.id)}
					<li>
						<a
							href={userHref(user)}
							onclick={close}
							class="flex items-center gap-3 px-3 py-2 text-sm hover:bg-bg-muted"
						>
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
							>
								{user.name[0].toUpperCase()}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-medium text-fg">{user.name}</span>
								{#if user.publicSlug}
									<span class="block truncate text-xs text-fg-muted">/u/{user.publicSlug}</span>
								{/if}
							</span>
							<span
								class="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg"
							>
								L{user.level}
							</span>
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
