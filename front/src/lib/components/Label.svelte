<script lang="ts">
    import type { Snippet } from "svelte";
	import { twMerge } from "tailwind-merge";

    /**
     * Props interface for Label component
     */
    interface LabelProps {
        /** Content to display inside the label */
        children: Snippet;
        /** Optional prefix text */
        prefix?: string;
        /** Optional suffix text */
        suffix?: string;
        /** Color theme for the label */
        color?: "primary" | "secondary" | "green" | "red" | "yellow" | "blue" | "indigo" | "purple" | "pink" | "orange";
        /** Size of the label */
        size?: "small" | "medium" | "large";
        /** Whether to use outline style */
        outline?: boolean;
        /** Whether the label is disabled */
        disabled?: boolean;
        /** Border radius style */
        rounded?: 'full' | 'lg' | 'none';
        /** Whether label should take full width */
        fullwidth?: boolean;
        /** Additional CSS classes */
        className?: string;
    }

    const {
        children,
        prefix,
        suffix,
        color = "primary",
        size = "medium",
        outline = false,
        disabled = false,
        rounded = "full",
        fullwidth = false,
        className = "",
        ...props
    }: LabelProps = $props();

    const colorClassesPlain = {
        primary: "bg-primary-200 text-primary-900 border-primary-200",
        secondary: "bg-secondary-200 text-secondary-900 border-secondary-200",
        green: "bg-green-200 text-green-900 border-green-200",
        red: "bg-red-200 text-red-900 border-red-200",
        yellow: "bg-yellow-200 text-yellow-900 border-yellow-200",
        blue: "bg-blue-200 text-blue-900 border-blue-200",
        indigo: "bg-indigo-200 text-indigo-900 border-indigo-200",
        purple: "bg-purple-200 text-purple-900 border-purple-200",
        pink: "bg-pink-200 text-pink-900 border-pink-200",
        orange: "bg-orange-200 text-orange-900 border-orange-200"
    };

    const colorClassesOutline = {
        primary: "bg-transparent text-primary-900 border-primary-200",
        secondary: "bg-transparent text-secondary-900 border-secondary-200",
        green: "bg-transparent text-green-900 border-green-200",
        red: "bg-transparent text-red-900 border-red-200",
        yellow: "bg-transparent text-yellow-900 border-yellow-200",
        blue: "bg-transparent text-blue-900 border-blue-200",
        indigo: "bg-transparent text-indigo-900 border-indigo-200",
        purple: "bg-transparent text-purple-900 border-purple-200",
        pink: "bg-transparent text-pink-900 border-pink-200",
        orange: "bg-transparent text-orange-900 border-orange-200"
    };

    const sizeClasses = {
        small: "px-2 py-1 text-sm h-8",
        medium: "px-3 py-2 text-md h-10",
        large: "px-4 py-3 text-lg h-12"
    };

    const roundedClasses = {
        full: "rounded-full",
        lg: "rounded-lg",
        none: "rounded-none"
    };

    const baseClasses = twMerge(
		'inline-flex items-center border text-nowrap transition-colors duration-300',
        roundedClasses[rounded],
        sizeClasses[size],
        outline ? colorClassesOutline[color] : colorClassesPlain[color],
        disabled && "opacity-75 cursor-not-allowed",
        fullwidth && "w-full justify-center",
        className
	);
</script>

<span {...props} class={baseClasses}>
    {#if prefix}
        <span class="mr-1">{prefix}</span>
    {/if}
    {@render children()}
    {#if suffix}
        <span class="ml-1">{suffix}</span>
    {/if}
</span>