<script lang="ts">
    import { error } from "../store/error";
    import { slide } from "svelte/transition";
    import { twMerge } from "tailwind-merge";

    /**
     * Props interface for Error component
     */
    interface ErrorProps {
        /** Whether errors can be dismissed */
        dismissible?: boolean;
        /** Type of error style */
        type?: 'error' | 'warning' | 'info';
        /** Custom message (overrides store errors) */
        message?: string;
        /** Display timeout in milliseconds (0 for no auto-dismiss) */
        timeout?: number;
    }

    const { 
        dismissible = true, 
        type = 'error',
        message,
        timeout = 3000
    }: ErrorProps = $props();

    // Local errors array for dismissible functionality
    let localErrors = $state<string[]>([]);
    
    // Sync store errors with local errors
    $effect(() => {
        if (message) {
            localErrors = [message];
        } else {
            localErrors = [...$error];
        }
        
        // Auto-dismiss after timeout
        if (timeout > 0) {
            const timerId = setTimeout(() => {
                localErrors = [];
            }, timeout);
            
            return () => clearTimeout(timerId);
        }
    });

    function dismissError(index: number) {
        localErrors = localErrors.filter((_, i) => i !== index);
        
        // If using store errors, also remove from store
        if (!message && $error[index]) {
            error.set($error.filter((_, i) => i !== index));
        }
    }
    
    const typeClasses = {
        error: "bg-red-500 text-white",
        warning: "bg-yellow-500 text-white",
        info: "bg-blue-500 text-white"
    };
</script>

{#if localErrors.length}
    <div class="space-y-2 mb-4">
        {#each localErrors as err, i}
            <div 
                class={twMerge(
                    "px-4 py-3 rounded-lg flex items-center justify-between", 
                    typeClasses[type]
                )}
                transition:slide={{ duration: 300 }}
                role="alert"
            >
                <div>
                    <span class="font-bold mr-2">{type === 'error' ? 'Error!' : type === 'warning' ? 'Warning!' : 'Info:'}</span>
                    {err}
                </div>
                
                {#if dismissible}
                    <button 
                        type="button"
                        class="ml-4 text-white hover:text-gray-200 focus:outline-none"
                        aria-label="Dismiss"
                        onclick={() => dismissError(i)}
                    >
                        ✕
                    </button>
                {/if}
            </div>
        {/each}
    </div>
{/if}