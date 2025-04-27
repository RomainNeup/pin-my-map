<script lang="ts">
    import type { Snippet } from "svelte";
    import { twMerge } from "tailwind-merge";

    /**
     * Props interface for Title component
     */
    interface TitleProps {
        /** Content to display inside the title */
        children: Snippet;
        /** Heading level (h1-h6) */
        level?: 1 | 2 | 3 | 4 | 5 | 6;
        /** Optional CSS class name */
        className?: string;
        /** Text color */
        color?: "primary" | "secondary" | "green" | "red" | "yellow" | "blue" | "indigo" | "purple" | "pink" | "orange" | "default";
        /** Whether title is bold */
        bold?: boolean;
        /** Font weight */
        weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
        /** Whether title should take full width */
        fullwidth?: boolean;
        /** Text alignment */
        align?: 'left' | 'center' | 'right';
    }

    const { 
        children, 
        level = 1,
        className = "",
        color = "primary",
        bold = true,
        weight = "black",
        fullwidth = false,
        align = "left",
        ...props 
    }: TitleProps = $props();

    const colorClasses = {
        primary: "text-primary",
        secondary: "text-secondary",
        green: "text-green-600",
        red: "text-red-600",
        yellow: "text-yellow-600",
        blue: "text-blue-600",
        indigo: "text-indigo-600",
        purple: "text-purple-600",
        pink: "text-pink-600",
        orange: "text-orange-600",
        default: "text-gray-900"
    };
    
    const sizeClasses = {
        1: "text-3xl md:text-4xl",
        2: "text-2xl md:text-3xl",
        3: "text-xl md:text-2xl",
        4: "text-lg md:text-xl",
        5: "text-md md:text-lg",
        6: "text-sm md:text-md"
    };

    const weightClasses = {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
        black: "font-black"
    };

    const alignClasses = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
    };

    const baseClasses = twMerge(
        bold ? "font-black" : weightClasses[weight],
        sizeClasses[level],
        colorClasses[color],
        alignClasses[align],
        fullwidth && "w-full",
        className
    );
</script>

{#if level === 1}
    <h1 {...props} class={baseClasses}>{@render children()}</h1>
{:else if level === 2}
    <h2 {...props} class={baseClasses}>{@render children()}</h2>
{:else if level === 3}
    <h3 {...props} class={baseClasses}>{@render children()}</h3>
{:else if level === 4}
    <h4 {...props} class={baseClasses}>{@render children()}</h4>
{:else if level === 5}
    <h5 {...props} class={baseClasses}>{@render children()}</h5>
{:else if level === 6}
    <h6 {...props} class={baseClasses}>{@render children()}</h6>
{/if}