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
        type?: 'error' | 'warning' | 'info' | 'success';
        /** Custom message (overrides store errors) */
        message?: string;
        /** Display timeout in milliseconds (0 for no auto-dismiss) */
        timeout?: number;
        /** Size of the error component */
        size?: 'small' | 'medium' | 'large';
        /** Border radius style */
        rounded?: 'full' | 'lg' | 'none';
        /** Whether to use outline style */
        outline?: boolean;
        /** Whether error should take full width */
        fullwidth?: boolean;
        /** Additional CSS classes */
        className?: string;
    }

    const { 
        dismissible = true, 
        type = 'error',
        message,
        timeout = 3000,
        size = 'medium',
        rounded = 'lg',
        outline = false,
        fullwidth = false,
        className = ''
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
    
    const sizeClasses = {
        small: 'px-2 py-1 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg'
    };

    const roundedClasses = {
        full: 'rounded-full',
        lg: 'rounded-lg',
        none: 'rounded-none'
    };

    const typeClassesPlain = {
        error: "bg-red-500 text-white border-red-500",
        warning: "bg-yellow-500 text-white border-yellow-500",
        info: "bg-blue-500 text-white border-blue-500",
        success: "bg-green-500 text-white border-green-500"
    };

    const typeClassesOutline = {
        error: "bg-transparent text-red-700 border-red-500",
        warning: "bg-transparent text-yellow-700 border-yellow-500",
        info: "bg-transparent text-blue-700 border-blue-500",
        success: "bg-transparent text-green-700 border-green-500"
    };
</script>

{#if localErrors.length}
    <div class={twMerge("space-y-2 mb-4", fullwidth && "w-full", className)}>
        {#each localErrors as err, i}
            <div 
                class={twMerge(
                    "flex items-center justify-between border", 
                    sizeClasses[size],
                    roundedClasses[rounded],
                    outline ? typeClassesOutline[type] : typeClassesPlain[type],
                )}
                transition:slide={{ duration: 300 }}
                role="alert"
            >
                <div>
                    <span class="font-bold mr-2">
                        {type === 'error' ? 'Error!' : 
                         type === 'warning' ? 'Warning!' : 
                         type === 'success' ? 'Success!' : 'Info:'}
                    </span>
                    {err}
                </div>
                
                {#if dismissible}
                    <button 
                        type="button"
                        class={twMerge(
                            "ml-4 hover:opacity-75 focus:outline-none",
                            outline ? typeClassesOutline[type].split(' ')[1] : "text-white"
                        )}
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