<script>
    import { error } from "../store/error";
</script>

{#if $error.length}
    {#each $error as err}
        <div class="px-4 py-2 rounded-lg bg-red-500 text-white text-center">
            <span class="font-bold">Error!</span> {err}
        </div>
    {/each}
{/if}