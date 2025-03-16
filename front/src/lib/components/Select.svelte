<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';

	type Props = {
		options: string[];
		values?: string[];
		placeholder?: string;
		size?: 'small' | 'medium' | 'large';
		outline?: boolean;
		suffix?: string;
		prefix?: string;
		onChange?: (values: string[]) => void;
	};

	let {
		options,
		values = $bindable([]),
		placeholder = 'Select an option',
		size = 'medium',
		outline = false,
		suffix,
		prefix,
		onChange
	}: Props = $props();

	let isOpen = $state(false);

	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2',
		large: 'px-6 py-3 text-lg'
	};

	const toggle = () => (isOpen = !isOpen);

	const selectOption = (option: string) => {
		if (values.includes(option)) {
			values = values.filter((value) => value !== option);
		} else {
			values = [...values, option];
		}
		onChange && onChange(values);
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
