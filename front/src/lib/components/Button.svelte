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
		rounded?: 'full' | 'lg' | 'none';
		type?: 'button' | 'submit' | 'reset';
		className?: string;
		fullwidth?: boolean;
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
		type = 'button',
		className = '',
		fullwidth = false,
		...props
	}: Props = $props();

	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2 text-md',
		large: 'px-6 py-3 text-lg'
	};

	const colorClassesPlain = {
		primary: 'bg-primary border-primary text-white hover:bg-primary-700 focus:bg-primary-700',
		secondary: 'bg-secondary border-secondary text-white hover:bg-secondary-700 focus:bg-secondary-700',
		green: 'bg-green-500 border-green-500 text-white hover:bg-green-700 focus:bg-green-700',
		red: 'bg-red-500 border-red-500 text-white hover:bg-red-700 focus:bg-red-700'
	};

	const colorClassesOutline = {
		primary: 'border-primary text-primary hover:bg-primary hover:text-white focus:bg-primary focus:text-white',
		secondary: 'border-secondary text-secondary hover:bg-secondary hover:text-white focus:bg-secondary focus:text-white',
		green: 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:bg-green-500 focus:text-white',
		red: 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white'
	};

	const roundedClasses = {
		full: 'rounded-full',
		lg: 'rounded-lg',
		none: 'rounded-none'
	};

	const baseClasses = twMerge(
		'text-nowrap border transition-colors duration-700 block text-center',
		roundedClasses[rounded],
		outline ? colorClassesOutline[color] : colorClassesPlain[color],
		sizeClasses[size],
		fullwidth && 'w-full',
		className
	);
	const prefixClasses = twMerge(
		size === 'small' && 'text-xs mr-0.5',
		size === 'medium' && 'text-sm mr-1',
		size === 'large' && 'text-md mr-1'
	);
	const suffixClasses = twMerge(
		size === 'small' && 'text-xs ml-0.5',
		size === 'medium' && 'text-sm ml-1',
		size === 'large' && 'text-md ml-1'
	);
</script>

{#if href}
	<a class={baseClasses} {href} {...props}>
        {#if prefix}
            <span class={prefixClasses}>{prefix}</span>
        {/if}
		{@render children()}
        {#if suffix}
            <span class={suffixClasses}>{suffix}</span>
        {/if}
	</a>
{:else}
	<button class={baseClasses} onclick={onClick} type={type} {...props}>
        {#if prefix}
            <span class={prefixClasses}>{prefix}</span>
        {/if}
		{@render children()}
        {#if suffix}
            <span class={suffixClasses}>{suffix}</span>
        {/if}
	</button>
{/if}
