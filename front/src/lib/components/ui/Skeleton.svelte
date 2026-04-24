<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface SkeletonProps {
		w?: string;
		h?: string;
		rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		class?: string;
	}

	const { w = 'w-full', h = 'h-4', rounded = 'md', class: className }: SkeletonProps = $props();

	const cls = twMerge('block animate-pulse bg-bg-inset', w, h, `rounded-${rounded}`, className);
</script>

<span class={cls} aria-hidden="true"></span>
