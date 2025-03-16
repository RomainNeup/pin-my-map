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
    }

    const {
        children,
        prefix,
        suffix,
        color = "primary",
        size = "medium",
        outline = false,
        ...props
    }: LabelProps = $props();

    const colorClasses = {
        primary: "bg-primary-100 text-primary-900 border-primary-100",
        secondary: "bg-secondary-100 text-secondary-900 border-secondary-100",
        green: "bg-green-100 text-green-900 border-green-100",
        red: "bg-red-100 text-red-900 border-red-100",
        yellow: "bg-yellow-100 text-yellow-900 border-yellow-100",
        blue: "bg-blue-100 text-blue-900 border-blue-100",
        indigo: "bg-indigo-100 text-indigo-900 border-indigo-100",
        purple: "bg-purple-100 text-purple-900 border-purple-100",
        pink: "bg-pink-100 text-pink-900 border-pink-100",
        orange: "bg-orange-100 text-orange-900 border-orange-100"
    };

    const sizeClasses = {
        small: "px-2 py-1 text-sm",
        medium: "px-3 py-2 text-md",
        large: "px-4 py-3 text-lg"
    };

    const baseClasses = twMerge(
		'inline-flex items-center rounded-full border text-nowrap',
        sizeClasses[size],
        colorClasses[color]
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