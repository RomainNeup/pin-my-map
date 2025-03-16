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
        color?: "primary" | "secondary" | "default";
    }

    const { 
        children, 
        level = 1,
        className = "",
        color = "primary",
        ...props 
    }: TitleProps = $props();

    const colorClasses = {
        primary: "text-primary",
        secondary: "text-secondary",
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

    const baseClasses = twMerge(
        "font-black",
        sizeClasses[level],
        colorClasses[color],
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