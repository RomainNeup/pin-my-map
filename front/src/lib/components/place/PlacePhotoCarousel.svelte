<script lang="ts">
	import type { PlaceEnrichmentPhoto } from '$lib/api/place';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';

	type Props = { photos: PlaceEnrichmentPhoto[] };
	let { photos }: Props = $props();

	let current = $state(0);

	const prev = () => {
		current = (current - 1 + photos.length) % photos.length;
	};

	const next = () => {
		current = (current + 1) % photos.length;
	};
</script>

{#if photos.length > 0}
	<div class="relative overflow-hidden rounded-xl">
		<img
			src={photos[current].url}
			alt={photos[current].attribution ?? ''}
			class="h-48 w-full object-cover md:h-72"
			loading="lazy"
		/>

		{#if photos.length > 1}
			<button
				type="button"
				onclick={prev}
				aria-label="Previous photo"
				class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
			>
				<ChevronLeft class="h-5 w-5" />
			</button>
			<button
				type="button"
				onclick={next}
				aria-label="Next photo"
				class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
			>
				<ChevronRight class="h-5 w-5" />
			</button>

			<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
				{#each photos as _, i (i)}
					<button
						type="button"
						onclick={() => (current = i)}
						aria-label={`Go to photo ${i + 1}`}
						class={`h-2 w-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
					></button>
				{/each}
			</div>
		{/if}

		{#if photos[current].attribution}
			<p class="absolute bottom-0 right-0 rounded-tl bg-black/40 px-2 py-0.5 text-xs text-white">
				{photos[current].attribution}
			</p>
		{/if}
	</div>
{/if}
