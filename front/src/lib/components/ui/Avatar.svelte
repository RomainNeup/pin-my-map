<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface AvatarProps {
		name: string;
		src?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	const { name, src, size = 'md', class: className }: AvatarProps = $props();

	const sizeCls = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-base' };

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('') || '?'
	);

	const tints = [
		'bg-teal-100 text-teal-900',
		'bg-amber-100 text-amber-900',
		'bg-rose-100 text-rose-900',
		'bg-sky-100 text-sky-900',
		'bg-violet-100 text-violet-900',
		'bg-emerald-100 text-emerald-900'
	];

	const tint = $derived(
		tints[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % tints.length]
	);
</script>

{#if src}
	<img
		{src}
		alt={name}
		class={twMerge('inline-block rounded-full object-cover', sizeCls[size], className)}
	/>
{:else}
	<span
		class={twMerge(
			'inline-flex items-center justify-center rounded-full font-semibold',
			sizeCls[size],
			tint,
			className
		)}
		aria-label={name}>{initials}</span
	>
{/if}
