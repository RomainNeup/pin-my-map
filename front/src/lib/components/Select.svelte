<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { twMerge } from 'tailwind-merge';
	import { clickOutside } from '$lib/utils/clickOutside';
	import { fly } from 'svelte/transition';
	import Input from './Input.svelte';
	import EmojiPicker from './EmojiPicker.svelte';

	interface SelectProps {
		options: string[];
		values?: string[];
		placeholder?: string;
		size?: 'sm' | 'md' | 'lg';
		onChange?: (values: string[]) => void;
		newOptionPlaceholder?: string;
		onAddOption?: (option: string, optionEmoji: string) => void;
		disabled?: boolean;
		fullwidth?: boolean;
		class?: string;
	}

	let {
		options,
		values = $bindable([]),
		placeholder = 'Select',
		size = 'md',
		onChange,
		newOptionPlaceholder = 'Add new option',
		onAddOption,
		disabled = false,
		fullwidth = false,
		class: className
	}: SelectProps = $props();

	let isOpen = $state(false);
	let newOption = $state('');
	let newOptionEmoji = $state('');

	const sizeCls = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-10 px-3 text-sm',
		lg: 'h-11 px-4 text-base'
	};

	const toggle = () => {
		if (!disabled) isOpen = !isOpen;
	};

	const selectOption = (option: string) => {
		if (disabled) return;
		if (values.includes(option)) {
			values = values.filter((v) => v !== option);
		} else {
			values = [...values, option];
		}
		onChange?.(values);
	};
</script>

<div
	class={twMerge('relative inline-block', fullwidth && 'w-full', className)}
	use:clickOutside={() => (isOpen = false)}
>
	<button
		type="button"
		class={twMerge(
			'inline-flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-elevated text-fg',
			'transition-colors duration-150 hover:bg-bg-muted',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
			sizeCls[size],
			fullwidth && 'w-full',
			disabled && 'cursor-not-allowed opacity-60'
		)}
		onclick={toggle}
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class={values.length === 0 ? 'text-fg-subtle' : ''}>
			{values.length === 0 ? placeholder : `${values.length} selected`}
		</span>
		<ChevronDown class="h-4 w-4 text-fg-muted" />
	</button>

	{#if isOpen}
		<div
			transition:fly={{ y: -4, duration: 120 }}
			class="absolute left-0 right-0 z-popover mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-bg-elevated shadow-lg"
			role="listbox"
		>
			<ul class="py-1">
				{#each options as option}
					{@const isSelected = values.includes(option)}
					<li>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-bg-muted"
							onclick={() => selectOption(option)}
							role="option"
							aria-selected={isSelected}
						>
							<span>{option}</span>
							{#if isSelected}<Check class="h-4 w-4 text-accent" />{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if onAddOption}
				<div class="flex items-center gap-1 border-t border-border p-2">
					<EmojiPicker bind:value={newOptionEmoji} />
					<Input
						bind:value={newOption}
						type="text"
						placeholder={newOptionPlaceholder}
						size="sm"
						onKeydown={(e) => {
							if (e.key === 'Enter' && newOption) {
								onAddOption(newOption, newOptionEmoji);
								newOption = '';
								newOptionEmoji = '';
							}
						}}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
