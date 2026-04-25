<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface InputProps {
		value: string | number | File | null;
		placeholder?: string;
		type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea' | 'file' | 'date';
		size?: 'sm' | 'md' | 'lg';
		fullwidth?: boolean;
		id?: string;
		required?: boolean;
		error?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		autocomplete?: any;
		class?: string;
		onInput?: (event: Event) => void;
		onKeydown?: (event: KeyboardEvent) => void;
		onBlur?: (event: FocusEvent) => void;
		onFocus?: (event: FocusEvent) => void;
	}

	let {
		value = $bindable(),
		placeholder = '',
		type = 'text',
		size = 'md',
		fullwidth = true,
		id,
		required = false,
		error = false,
		disabled = false,
		readonly = false,
		autocomplete,
		class: className,
		onInput,
		onKeydown,
		onBlur,
		onFocus
	}: InputProps = $props();

	const sizeCls = {
		sm: 'h-9 px-3 text-sm',
		md: 'h-10 px-3 text-sm',
		lg: 'h-11 px-4 text-base'
	};

	const base = $derived(
		twMerge(
			'block rounded-lg border bg-bg-elevated text-fg placeholder:text-fg-subtle',
			'focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-accent',
			'transition-colors duration-150',
			sizeCls[size],
			error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border',
			fullwidth && 'w-full',
			disabled && 'cursor-not-allowed opacity-60',
			type === 'textarea' && 'py-2 h-auto min-h-[80px]',
			type === 'file' && 'file:hidden',
			className
		)
	);
</script>

{#if type === 'textarea'}
	<textarea
		{id}
		class={base}
		{placeholder}
		bind:value
		oninput={onInput}
		onkeydown={onKeydown}
		onblur={onBlur}
		onfocus={onFocus}
		aria-invalid={error || undefined}
		{disabled}
		{readonly}
		{required}
		{autocomplete}
		rows="3"
	></textarea>
{:else if type === 'number'}
	<input
		{id}
		class={base}
		{placeholder}
		bind:value
		type="number"
		step="any"
		oninput={onInput}
		onkeydown={onKeydown}
		onblur={onBlur}
		onfocus={onFocus}
		aria-invalid={error || undefined}
		{disabled}
		{readonly}
		{required}
		{autocomplete}
	/>
{:else}
	<input
		{id}
		class={base}
		{placeholder}
		bind:value
		{type}
		oninput={onInput}
		onkeydown={onKeydown}
		onblur={onBlur}
		onfocus={onFocus}
		aria-invalid={error || undefined}
		{disabled}
		{readonly}
		{required}
		{autocomplete}
	/>
{/if}
