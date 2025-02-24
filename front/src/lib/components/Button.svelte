<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		onClick?: () => void;
		children: Snippet;
        prefix?: string;
        suffix?: string;
		href?: string;
		size?: 'small' | 'medium' | 'large';
		outline?: boolean;
		color?: 'primary' | 'secondary' | 'green' | 'red';
		rounded?: 'full' | 'none';
	};

	const {
		onClick,
		children,
        prefix,
        suffix,
		href,
		size = 'medium',
		outline,
		color = 'primary',
        rounded = 'full',
		...props
	}: Props = $props();

	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2 text-md',
		large: 'px-6 py-3 text-lg'
	};

	const colorClassesPlain = {
		primary: 'bg-primary border-primary text-white hover:bg-primary-700',
		secondary: 'bg-secondary border-secondary text-white hover:bg-secondary-700',
		green: 'bg-green-500 border-green-500 text-white hover:bg-green-700',
		red: 'bg-red-500 border-red-500 text-white hover:bg-red-700'
	};

	const colorClassesOutline = {
		primary: 'border-primary text-primary hover:bg-primary hover:text-white',
		secondary: 'border-secondary text-secondary hover:bg-secondary hover:text-white',
		green: 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white',
		red: 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
	};

	const roundedClasses = {
		full: 'rounded-full',
		none: 'rounded-none'
	};

	const baseClasses = twMerge(
		'text-nowrap border transition-colors duration-700',
		roundedClasses[rounded],
		outline ? colorClassesOutline[color] : colorClassesPlain[color],
		sizeClasses[size]
	);
</script>

{#if href}
	<a class={baseClasses} {href} {...props}>
        {#if prefix}
            <span class="mr-1">{prefix}</span>
        {/if}
		{@render children()}
        {#if suffix}
            <span class="ml-1">{suffix}</span>
        {/if}
	</a>
{:else}
	<button class={baseClasses} onclick={onClick} {...props}>
        {#if prefix}
            <span class="mr-1">{prefix}</span>
        {/if}
		{@render children()}
        {#if suffix}
            <span class="ml-1">{suffix}</span>
        {/if}
	</button>
{/if}
