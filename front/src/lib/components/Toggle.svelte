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
		/** Color when unchecked */
		uncheckedColor?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
		/** Color when checked */
		checkedColor?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
		/** Whether toggle should take full width */
		fullwidth?: boolean;
		/** Additional CSS classes */
		className?: string;
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
		size = 'medium',
		uncheckedColor = 'red',
		checkedColor = 'green',
		fullwidth = false,
		className = '',
	}: ToggleProps = $props();

	const checkedBoxColorClasses = {
		primary: 'bg-primary-200',
		secondary: 'bg-secondary-200',
		green: 'bg-green-200',
		red: 'bg-red-200',
		yellow: 'bg-yellow-200',
		blue: 'bg-blue-200',
		indigo: 'bg-indigo-200',
		purple: 'bg-purple-200',
		pink: 'bg-pink-200',
		orange: 'bg-orange-200'
	};
	const checkedDotColorClasses = {
		primary: 'bg-primary-900',
		secondary: 'bg-secondary-900',
		green: 'bg-green-900',
		red: 'bg-red-900',
		yellow: 'bg-yellow-900',
		blue: 'bg-blue-900',
		indigo: 'bg-indigo-900',
		purple: 'bg-purple-900',
		pink: 'bg-pink-900',
		orange: 'bg-orange-900'
	};
	const uncheckedBoxColorClasses = {
		primary: 'bg-primary-200',
		secondary: 'bg-secondary-200',
		green: 'bg-green-200',
		red: 'bg-red-200',
		yellow: 'bg-yellow-200',
		blue: 'bg-blue-200',
		indigo: 'bg-indigo-200',
		purple: 'bg-purple-200',
		pink: 'bg-pink-200',
		orange: 'bg-orange-200'
	};
	const uncheckedDotColorClasses = {
		primary: 'bg-primary-900',
		secondary: 'bg-secondary-900',
		green: 'bg-green-900',
		red: 'bg-red-900',
		yellow: 'bg-yellow-900',
		blue: 'bg-blue-900',
		indigo: 'bg-indigo-900',
		purple: 'bg-purple-900',
		pink: 'bg-pink-900',
		orange: 'bg-orange-900'
	};

	/**
	 * Handle toggle state changes
	 */
	const handleChange = () => {
		if (onToggle) {
			onToggle(toggle.checked);
		}
		if (size === 'small') {
			toggleDot.classList.toggle('translate-x-7');
		} else if (size === 'medium') {
			toggleDot.classList.toggle('translate-x-9');
		} else {
			toggleDot.classList.toggle('translate-x-11');
		}

		if (toggle.checked) {
			toggleBox.classList.remove(uncheckedBoxColorClasses[uncheckedColor]);
			toggleBox.classList.add(checkedBoxColorClasses[checkedColor]);
			toggleDot.classList.remove(uncheckedDotColorClasses[uncheckedColor]);
			toggleDot.classList.add(checkedDotColorClasses[checkedColor]);
		} else {
			toggleBox.classList.remove(checkedBoxColorClasses[checkedColor]);
			toggleBox.classList.add(uncheckedBoxColorClasses[uncheckedColor]);
			toggleDot.classList.remove(checkedDotColorClasses[checkedColor]);
			toggleDot.classList.add(uncheckedDotColorClasses[uncheckedColor]);
		}
	};

	onMount(() => {
		toggle.addEventListener('change', handleChange);
	});

	// Size classes
	const sizeClasses = {
		small: { toggle: 'h-8 w-16', dot: 'h-6 w-6' },
		medium: { toggle: 'h-10 w-20', dot: 'h-8 w-8' },
		large: { toggle: 'h-12 w-24', dot: 'h-10 w-10' }
	};

	const toggleClass = {
		small: 'translate-x-7',
		medium: 'translate-x-9',
		large: 'translate-x-11'
	}

	const toggleBoxBaseClass = twMerge(
		'rounded-full transition-colors duration-300 flex items-center px-1',
		sizeClasses[size].toggle,
		value ? checkedBoxColorClasses[checkedColor] : uncheckedBoxColorClasses[uncheckedColor],
		disabled && 'opacity-50 cursor-not-allowed',
		fullwidth && 'w-full',
		className
	);

	const toggleDotBaseClass = twMerge(
		'toggle-dot m-0.5 transform rounded-full text-center shadow-md transition-all duration-300 ease-in-out',
		sizeClasses[size].dot,
		value ? checkedDotColorClasses[checkedColor] : uncheckedDotColorClasses[uncheckedColor],
		value && toggleClass[size]
	);
</script>

<div class={twMerge(fullwidth && 'w-full')}>
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
		class={twMerge("flex cursor-pointer items-center", disabled && "cursor-not-allowed", fullwidth && "w-full")}
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
