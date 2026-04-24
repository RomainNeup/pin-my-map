<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface LoaderProps {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	const { size = 'md', class: className }: LoaderProps = $props();

	const sizeCls = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
</script>

<span class={twMerge('inline-block text-accent', sizeCls[size], className)} aria-hidden="true">
	<svg viewBox="0 0 24 24" fill="none" class="animate-spin">
		<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.2" />
		<path
			d="M22 12a10 10 0 0 0-10-10"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
</span>
