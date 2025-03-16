<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';

	/**
	 * Component Props Interface
	 */
	interface SelectProps {
		/** List of options to display */
		options: string[];
		/** Currently selected values */
		values?: string[];
		/** Placeholder text when no options selected */
		placeholder?: string;
		/** Size of the select component */
		size?: 'small' | 'medium' | 'large';
		/** Whether to use outline styling */
		outline?: boolean;
		/** Text or icon to display after the main content */
		suffix?: string;
		/** Text or icon to display before the main content */
		prefix?: string;
		/** Function called when selected values change */
		onChange?: (values: string[]) => void;
	}

	// Props with defaults
	let {
		options,
		values = $bindable([]),
		placeholder = 'Select an option',
		size = 'medium',
		outline = false,
		suffix,
		prefix,
		onChange
	}: SelectProps = $props();

	// Component state
	let isOpen = $state(false);

	// Size variant classes
	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2',
		large: 'px-6 py-3 text-lg'
	};

	/**
	 * Toggle dropdown visibility
	 */
	const toggle = () => (isOpen = !isOpen);

	/**
	 * Handle option selection/deselection
	 */
	const selectOption = (option: string) => {
		if (values.includes(option)) {
			values = values.filter((value) => value !== option);
		} else {
			values = [...values, option];
		}
		onChange?.(values);
	};
</script>

<Button {size} onClick={toggle} {outline} {suffix} {prefix} className="inline-flex items-center">
	{placeholder}
</Button>

{#if isOpen}
	<div transition:slide class="z-10 mt-1 space-y-1 overflow-hidden rounded-lg py-2">
		<p>{placeholder}</p>
		<div class="flex flex-wrap gap-1">
			{#each options as option}
				<Button onClick={() => selectOption(option)} size="small" outline={values.includes(option)}>
					{option}
				</Button>
			{/each}
		</div>
	</div>
{/if}
