<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface Props {
		value: string | number | File | null;
		placeholder: string;
		type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea' | 'file';
		size?: 'small' | 'medium' | 'large';
		color?: 'primary' | 'secondary' | 'green' | 'red';
		rounded?: 'full' | 'lg' | 'none';
		className?: string;
		fullwidth?: boolean;
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
		fullwidth,
		onInput,
		...props
	}: Props = $props();

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

	const baseClasses = twMerge(
		'border-primary focus:ring-primary focus:border-primary border px-4 py-2 focus:outline-none focus:ring-2',
		sizeClasses[size],
		colorClasses[color],
		roundedClasses[rounded],
		fullwidth && 'w-full',
		type === 'file' && 'file:hidden',
		className
	);
</script>

{#if type === 'textarea'}
	<textarea class={baseClasses} {placeholder} bind:value oninput={onInput} {...props}></textarea>
{:else if type === 'number'}
	<input class={baseClasses} {placeholder} bind:value type="number" step="any" oninput={onInput} {...props} />
{:else}
	<input
		class={baseClasses}
		{placeholder}
		bind:value
		type={type}
		oninput={onInput}
		{...props}
	/>
{/if}
