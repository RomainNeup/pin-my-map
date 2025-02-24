<script lang="ts">
    import { onMount } from "svelte";

    type Props = {
        label?: string;
        id?: string;
        value?: boolean;
    };

    var toggle: HTMLInputElement;
    var toggleDot: HTMLDivElement;
    var toggleBox: HTMLDivElement;

    let { label, id, value = $bindable() }: Props = $props();

    onMount(() => {
        toggle.addEventListener("change", () => {
            toggleDot.classList.toggle("translate-x-6");

            if (toggle.checked) {
                toggleBox.classList.remove("bg-red-400");
                toggleBox.classList.add("bg-green-400");
            } else {
                toggleBox.classList.remove("bg-green-400");
                toggleBox.classList.add("bg-red-400");
            }
        });
    });

</script>

<div>
    <input type="checkbox" class="hidden" bind:this={toggle} id={id || "toggle"} bind:checked={value} />
    <label for={id || "toggle"} class="flex items-center cursor-pointer">
        <div class="w-12 h-6 bg-red-400 rounded-full" bind:this={toggleBox}>
            <div class="toggle-dot w-5 h-5 m-0.5 bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out text-center" bind:this={toggleDot}></div>
        </div>
        {#if label}
            <div class="ml-3 text-gray-700 font-medium">{label}</div>
        {/if}
    </label>
</div>