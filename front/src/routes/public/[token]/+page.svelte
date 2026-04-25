<script lang="ts">
	import PublicMapView from '$lib/components/public/PublicMapView.svelte';
	import type { PageData } from './$types';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import Tag from 'lucide-svelte/icons/tag';
	import Star from 'lucide-svelte/icons/star';

	let { data }: { data: PageData } = $props();
</script>

{#if data.stats || data.map.owner.level !== undefined}
	<div class="mx-auto w-full max-w-6xl px-4 pt-4">
		<div
			class="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3"
		>
			{#if data.map.owner.level !== undefined}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-0.5 text-sm font-semibold text-accent"
				>
					<Star class="h-3.5 w-3.5" />
					Level {data.map.owner.level}
				</span>
			{/if}

			{#if data.stats}
				<span class="inline-flex items-center gap-1 text-sm text-fg-muted">
					<MapPin class="h-4 w-4" />
					{data.stats.savedCount} saved
				</span>
				<span class="inline-flex items-center gap-1 text-sm text-fg-muted">
					<CheckCircle class="h-4 w-4" />
					{data.stats.doneCount} done
				</span>
				<span class="inline-flex items-center gap-1 text-sm text-fg-muted">
					<Tag class="h-4 w-4" />
					{data.stats.tagCount} tag{data.stats.tagCount === 1 ? '' : 's'}
				</span>
			{/if}
		</div>
	</div>
{/if}

<!-- Strip userId so PublicMapView never renders the FollowButton for token-based share links -->
<PublicMapView
	map={{ ...data.map, owner: { ...data.map.owner, userId: undefined } }}
	basePath={data.basePath}
/>
