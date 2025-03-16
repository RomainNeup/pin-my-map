<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

    /**
     * Props interface for Button component
     */
	interface ButtonProps {
        /** Function called when button is clicked */
		onClick?: () => void;
        /** Button content */
		children: Snippet;
        /** Optional prefix text/icon */
        prefix?: string | Snippet;
        /** Optional suffix text/icon */
        suffix?: string | Snippet;
        /** URL if button should act as a link */
		href?: string;
        /** Button size */
		size?: 'small' | 'medium' | 'large';
        /** Whether to use outline style */
		outline?: boolean;
        /** Color theme for the button */
		color?: 'primary' | 'secondary' | 'green' | 'red';
        /** Border radius style */
		rounded?: 'full' | 'lg' | 'none';
        /** HTML button type */
		type?: 'button' | 'submit' | 'reset';
        /** Additional CSS classes */
		className?: string;
        /** Whether button should take full width */
		fullwidth?: boolean;
        /** Whether button is in loading state */
        loading?: boolean;
        /** Whether button is disabled */
        disabled?: boolean;
        /** Icon-only button (square) */
        iconOnly?: boolean;
	}

	const {
		onClick,
		children,
        prefix,
        suffix,
		href,
		size = 'medium',
		outline = false,
		color = 'primary',
        rounded = 'full',
		type = 'button',
		className = '',
		fullwidth = false,
        loading = false,
        disabled = false,
        iconOnly = false,
		...props
	}: ButtonProps = $props();

	const sizeClasses = {
		small: iconOnly ? 'p-1 text-sm' : 'px-2 py-1 text-sm',
		medium: iconOnly ? 'p-2 text-md' : 'px-4 py-2 text-md',
		large: iconOnly ? 'p-3 text-lg' : 'px-6 py-3 text-lg'
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
		'text-nowrap border transition-colors duration-300 block text-center relative',
		roundedClasses[rounded],
		outline ? colorClassesOutline[color] : colorClassesPlain[color],
		sizeClasses[size],
		fullwidth && 'w-full',
		(loading || disabled) && 'opacity-75 cursor-not-allowed',
        iconOnly && 'aspect-square inline-flex items-center justify-center',
		className
	);
	
	const prefixClasses = twMerge(
		size === 'small' && 'text-xs mr-0.5',
		size === 'medium' && 'text-sm mr-1',
		size === 'large' && 'text-md mr-1',
        loading && 'opacity-0'
	);
	
	const suffixClasses = twMerge(
		size === 'small' && 'text-xs ml-0.5',
		size === 'medium' && 'text-sm ml-1',
		size === 'large' && 'text-md ml-1',
        loading && 'opacity-0'
	);

    const contentClasses = twMerge(
        'inline-flex items-center justify-center',
        loading && 'opacity-0'
    );

    const spinnerClasses = twMerge(
        'absolute inset-0 flex items-center justify-center',
        !loading && 'hidden'
    );
</script>

{#if href && !disabled}
	<a class={baseClasses} {href} {...props}>
        {#if prefix}
            <span class={prefixClasses}>
                {#if typeof prefix === 'string'}
                    {prefix}
                {:else}
                    {@render prefix()}
                {/if}
            </span>
        {/if}
        <span class={contentClasses}>
		    {@render children()}
        </span>
        {#if suffix}
            <span class={suffixClasses}>
                {#if typeof suffix === 'string'}
                    {suffix}
                {:else}
                    {@render suffix()}
                {/if}
            </span>
        {/if}
        <span class={spinnerClasses} aria-hidden="true">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </span>
	</a>
{:else}
	<button 
        class={baseClasses} 
        onclick={onClick} 
        type={type} 
        disabled={disabled || loading} 
        aria-busy={loading}
        {...props}
    >
        {#if prefix}
            <span class={prefixClasses}>
                {#if typeof prefix === 'string'}
                    {prefix}
                {:else}
                    {@render prefix()}
                {/if}
            </span>
        {/if}
        <span class={contentClasses}>
		    {@render children()}
        </span>
        {#if suffix}
            <span class={suffixClasses}>
                {#if typeof suffix === 'string'}
                    {suffix}
                {:else}
                    {@render suffix()}
                {/if}
            </span>
        {/if}
        <span class={spinnerClasses} aria-hidden="true">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </span>
	</button>
{/if}
