<script lang="ts">
	import { slide } from 'svelte/transition';
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
		onChange,
		newOptionPlaceholder = 'Add new option',
		onAddOption
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
			{#if onAddOption}
				<div class="flex items-center border border-black rounded-full px-2">
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
					/>
				</div>
			{/if}
		</div>
	</div>
{/if}
