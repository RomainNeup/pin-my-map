<script lang="ts">
	import { slide } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';
	import Button from './Button.svelte';
	import Input from './Input.svelte';
	import EmojiPicker from './EmojiPicker.svelte';

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
		/** New option placeholder */
		newOptionPlaceholder?: string;
		/** Function called when adding a new option */
		onAddOption?: (option: string, optionEmoji: string) => void;
		/** Color theme for the select */
		color?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
		/** Border radius style */
		rounded?: 'full' | 'lg' | 'none';
		/** Whether the select is disabled */
		disabled?: boolean;
		/** Whether select should take full width */
		fullwidth?: boolean;
		/** Additional CSS classes */
		className?: string;
	}

	// Props with defaults
	let {
		options,
		values = $bindable([]),
		placeholder = 'Select an option',
		size = 'medium',
		outline = false,
		suffix,
		prefix = '▼',
		onChange,
		newOptionPlaceholder = 'Add new option',
		onAddOption,
		color = 'primary',
		rounded = 'full',
		disabled = false,
		fullwidth = false,
		className = ''
	}: SelectProps = $props();

	// Component state
	let isOpen = $state(false);
	let newOption = $state('');
	let newOptionEmoji = $state('');

	// Size variant classes
	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2',
		large: 'px-6 py-3 text-lg'
	};

	/**
	 * Toggle dropdown visibility
	 */
	const toggle = () => {
		if (!disabled) {
			isOpen = !isOpen;
		}
	};

	/**
	 * Handle option selection/deselection
	 */
	const selectOption = (option: string) => {
		if (disabled) return;
		
		if (values.includes(option)) {
			values = values.filter((value) => value !== option);
		} else {
			values = [...values, option];
		}
		onChange?.(values);
	};
</script>

<div class={twMerge(fullwidth && 'w-full relative', className)}>
	<Button 
		{size} 
		onClick={toggle} 
		{outline} 
		{suffix} 
		{prefix} 
		{color}
		{rounded}
		{disabled}
		fullwidth={fullwidth}
		className="inline-flex items-center justify-between"
	>
		{placeholder}
	</Button>

	{#if isOpen}
		<div 
			transition:slide 
			class="z-10 mt-1 space-y-1 overflow-hidden rounded-lg py-2 bg-white shadow-lg border border-gray-200 absolute w-full"
		>
			<p class="px-4 font-medium text-gray-700">{placeholder}</p>
			<div class="flex flex-wrap gap-1 px-2">
				{#each options as option}
					<Button 
						onClick={() => selectOption(option)} 
						size="small" 
						outline={!values.includes(option)}
						color={color}
					>
						{option}
					</Button>
				{/each}
				{#if onAddOption}
					<div class="flex items-center border border-gray-300 rounded-full px-2">
						<EmojiPicker bind:value={newOptionEmoji} />
						<Input
							border={false}
							bind:value={newOption}
							type="text"
							placeholder={newOptionPlaceholder}
							onKeydown={(e) => {
								if (e.key === 'Enter') {
									if (newOption) {
										onAddOption(newOption, newOptionEmoji);
										newOption = '';
										newOptionEmoji = '';
									}
								}
							}}
							size="small"
							color={color}
						/>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
