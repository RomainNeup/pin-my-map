<script lang="ts">
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	/**
	 * Props interface for Toggle component
	 */
	interface ToggleProps {
		/** Display label for the toggle */
		label?: string;
		/** Unique identifier for the toggle */
		id?: string;
		/** Current state of the toggle */
		value?: boolean;
		/** Function called when toggle state changes */
		onToggle?: (value: boolean) => void;
		/** Whether the toggle is disabled */
		disabled?: boolean;
		/** Size of the toggle */
		size?: 'small' | 'medium' | 'large';
	}

	// DOM references
	let toggle: HTMLInputElement;
	let toggleDot: HTMLDivElement;
	let toggleBox: HTMLDivElement;

	// Props with defaults
	let { 
		label, 
		id = 'toggle', 
		value = $bindable(false), 
		onToggle,
		disabled = false,
		size = 'medium'
	}: ToggleProps = $props();

	/**
	 * Handle toggle state changes
	 */
	const handleChange = () => {
		if (onToggle) {
			onToggle(toggle.checked);
		}
		if (size === 'small') {
			toggleDot.classList.toggle('translate-x-4');
		} else if (size === 'medium') {
			toggleDot.classList.toggle('translate-x-6');
		} else {
			toggleDot.classList.toggle('translate-x-8');
		}

		if (toggle.checked) {
			toggleBox.classList.remove('bg-red-400');
			toggleBox.classList.add('bg-green-400');
		} else {
			toggleBox.classList.remove('bg-green-400');
			toggleBox.classList.add('bg-red-400');
		}
	};

	onMount(() => {
		toggle.addEventListener('change', handleChange);
	});

	// Size classes
	const sizeClasses = {
		small: { toggle: 'h-4 w-8', dot: 'h-3 w-3' },
		medium: { toggle: 'h-6 w-12', dot: 'h-5 w-5' },
		large: { toggle: 'h-8 w-16', dot: 'h-7 w-7' }
	};

	const toggleClass = {
		small: 'translate-x-4',
		medium: 'translate-x-6',
		large: 'translate-x-8'
	}

	const toggleBoxBaseClass = twMerge(
		'rounded-full transition-colors duration-300',
		sizeClasses[size].toggle,
		value ? 'bg-green-400' : 'bg-red-400',
		disabled && 'opacity-50 cursor-not-allowed'
	);

	const toggleDotBaseClass = twMerge(
		'toggle-dot m-0.5 transform rounded-full bg-white text-center shadow-md transition-all duration-300 ease-in-out',
		sizeClasses[size].dot,
		sizeClasses[size].dot,
		value && toggleClass[size]
	);
</script>

<div>
	<input
		type="checkbox"
		class="sr-only"
		bind:this={toggle}
		id={id}
		bind:checked={value}
		aria-checked={value}
		aria-label={label || 'Toggle'}
		{disabled}
	/>
	<label 
		for={id} 
		class={twMerge("flex cursor-pointer items-center", disabled && "cursor-not-allowed")}
		aria-hidden="true"
	>
		<div class={toggleBoxBaseClass} bind:this={toggleBox}>
			<div class={toggleDotBaseClass} bind:this={toggleDot}></div>
		</div>
		{#if label}
			<div class="ml-3 font-medium text-gray-700">{label}</div>
		{/if}
	</label>
</div>
