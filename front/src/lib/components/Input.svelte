<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	/**
	 * Props interface for Input component
	 */
	interface InputProps {
		/** Input value */
		value: string | number | File | null;
		/** Placeholder text */
		placeholder: string;
		/** Input type */
		type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea' | 'file' | 'date';
		/** Size of the input */
		size?: 'small' | 'medium' | 'large';
		/** Color theme for the input */
		color?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
		/** Border radius style */
		rounded?: 'full' | 'lg' | 'none';
		/** Additional CSS classes */
		className?: string;
		/** Whether input should take full width */
		fullwidth?: boolean;
		/** Input label */
		label?: string;
		/** Whether the input is required */
		required?: boolean;
		/** Error message to display */
		error?: string;
		/** Whether the input is disabled */
		disabled?: boolean;
		/** Has border */
		border?: boolean;
		/** Whether to use outline style */
		outline?: boolean;
		/** Function called on input event */
		onInput?: (event: Event) => void;
		/** Function called on keydown event */
		onKeydown?: (event: KeyboardEvent) => void;
	}

	let {
		value = $bindable(),
		placeholder,
		type = 'text',
		size = 'medium',
		color = 'primary',
		rounded = 'full',
		className,
		fullwidth = false,
		label,
		required = false,
		error,
		disabled = false,
		border = true,
		outline = false,
		onInput,
		onKeydown,
		...props
	}: InputProps = $props();

	const sizeClasses = {
		small: 'px-2 py-1 text-sm h-8',
		medium: 'px-4 py-2 text-md h-10',
		large: 'px-6 py-3 text-lg h-12'
	};

	const colorClassesBordered = {
		primary: 'border-primary focus:ring-primary focus:border-primary',
		secondary: 'border-secondary focus:ring-secondary focus:border-secondary',
		green: 'border-green-500 focus:ring-green-500 focus:border-green-500',
		red: 'border-red-500 focus:ring-red-500 focus:border-red-500',
		yellow: 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500',
		blue: 'border-blue-500 focus:ring-blue-500 focus:border-blue-500',
		indigo: 'border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500',
		purple: 'border-purple-500 focus:ring-purple-500 focus:border-purple-500',
		pink: 'border-pink-500 focus:ring-pink-500 focus:border-pink-500',
		orange: 'border-orange-500 focus:ring-orange-500 focus:border-orange-500'
	};

	const colorClassesText = {
		primary: 'text-primary-900 placeholder-primary-500',
		secondary: 'text-secondary-900 placeholder-secondary-500',
		green: 'text-green-900 placeholder-green-500',
		red: 'text-red-900 placeholder-red-500',
		yellow: 'text-yellow-900 placeholder-yellow-500',
		blue: 'text-blue-900 placeholder-blue-500',
		indigo: 'text-indigo-900 placeholder-indigo-500',
		purple: 'text-purple-900 placeholder-purple-500',
		pink: 'text-pink-900 placeholder-pink-500',
		orange: 'text-orange-900 placeholder-orange-500'
	};

	const backgroundClasses = {
		primary: outline ? 'bg-transparent' : 'bg-primary-50',
		secondary: outline ? 'bg-transparent' : 'bg-secondary-50',
		green: outline ? 'bg-transparent' : 'bg-green-50',
		red: outline ? 'bg-transparent' : 'bg-red-50',
		yellow: outline ? 'bg-transparent' : 'bg-yellow-50',
		blue: outline ? 'bg-transparent' : 'bg-blue-50',
		indigo: outline ? 'bg-transparent' : 'bg-indigo-50',
		purple: outline ? 'bg-transparent' : 'bg-purple-50',
		pink: outline ? 'bg-transparent' : 'bg-pink-50',
		orange: outline ? 'bg-transparent' : 'bg-orange-50'
	};

	const roundedClasses = {
		full: 'rounded-full',
		lg: 'rounded-lg',
		none: 'rounded-none'
	};

	// Generate unique ID for label association
	const inputId = `input-${Math.random().toString(36).substring(2, 9)}`;

	const baseClasses = twMerge(
		'px-4 py-2 focus:outline-none focus:ring-2 transition-colors duration-300',
		border ? 'border' : 'border-0 focus:ring-0',
		sizeClasses[size],
		border ? colorClassesBordered[color] : '',
		colorClassesText[color],
		backgroundClasses[color],
		roundedClasses[rounded],
		fullwidth && 'w-full',
		type === 'file' && 'file:hidden',
		error ? border ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'text-red-500' : '',
		disabled && 'bg-gray-100 cursor-not-allowed opacity-75',
		className
	);

	const labelClasses = twMerge(
		'block mb-2 font-medium text-gray-700',
		size === 'small' && 'text-sm',
		size === 'large' && 'text-lg',
		required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
		error && 'text-red-500'
	);
</script>

{#if label}
	<label for={inputId} class={labelClasses}>
		{label}
	</label>
{/if}

{#if type === 'textarea'}
	<textarea
		id={inputId}
		class={baseClasses}
		{placeholder}
		bind:value
		oninput={onInput}
		onkeydown={onKeydown}
		aria-invalid={!!error}
		{disabled}
		{required}
		{...props}
	></textarea>
{:else if type === 'number'}
	<input
		id={inputId}
		class={baseClasses}
		{placeholder}
		bind:value
		type="number"
		step="any"
		oninput={onInput}
		onkeydown={onKeydown}
		aria-invalid={!!error}
		{disabled}
		{required}
		{...props}
	/>
{:else}
	<input
		id={inputId}
		class={baseClasses}
		{placeholder}
		bind:value
		{type}
		oninput={onInput}
		onkeydown={onKeydown}
		aria-invalid={!!error}
		{disabled}
		{required}
		{...props}
	/>
{/if}

{#if error}
	<p class="mt-1 text-sm text-red-600">{error}</p>
{/if}
