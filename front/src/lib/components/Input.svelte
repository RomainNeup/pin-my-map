<script lang="ts">
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
		color?: 'primary' | 'secondary' | 'green' | 'red';
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
		/** Function called on input event */
		onInput?: (event: Event) => void;
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
		onInput,
		...props
	}: InputProps = $props();

	const sizeClasses = {
		small: 'px-2 py-1 text-sm',
		medium: 'px-4 py-2 text-md',
		large: 'px-6 py-3 text-lg'
	};

	const colorClasses = {
		primary: 'border-primary focus:ring-primary focus:border-primary',
		secondary: 'border-secondary focus:ring-secondary focus:border-secondary',
		green: 'border-green-500 focus:ring-green-500 focus:border-green-500',
		red: 'border-red-500 focus:ring-red-500 focus:border-red-500'
	};

	const roundedClasses = {
		full: 'rounded-full',
		lg: 'rounded-lg',
		none: 'rounded-none'
	};

	// Generate unique ID for label association
	const inputId = `input-${Math.random().toString(36).substring(2, 9)}`;

	const baseClasses = twMerge(
		'border px-4 py-2 focus:outline-none focus:ring-2',
		sizeClasses[size],
		colorClasses[color],
		roundedClasses[rounded],
		fullwidth && 'w-full',
		type === 'file' && 'file:hidden',
		error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
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
		aria-invalid={!!error}
		{disabled}
		{required}
		{...props}
	/>
{/if}

{#if error}
	<p class="mt-1 text-sm text-red-600">{error}</p>
{/if}
