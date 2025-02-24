<script lang="ts">
    import type { Snippet } from "svelte";

    type Props = {
        children: Snippet;
    };

    const {children, ...props}: Props = $props();
</script>

<h1 {...props} class="font-black text-2xl text-primary">
    {@render children()}
</h1>