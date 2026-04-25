<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface ToggleProps {
		label?: string;
		id?: string;
		value?: boolean;
		onToggle?: (value: boolean) => void;
		disabled?: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		label,
		id = `toggle-${crypto.randomUUID()}`,
		value = $bindable(false),
		onToggle,
		disabled = false,
		size = 'md',
		class: className
	}: ToggleProps = $props();

	const dims = {
		sm: { track: 'h-5 w-9', dot: 'h-4 w-4', on: 'translate-x-4' },
		md: { track: 'h-6 w-11', dot: 'h-5 w-5', on: 'translate-x-5' },
		lg: { track: 'h-7 w-14', dot: 'h-6 w-6', on: 'translate-x-7' }
	};

	const handleClick = () => {
		if (disabled) return;
		value = !value;
		onToggle?.(value);
	};
</script>

<label for={id} class={twMerge('inline-flex cursor-pointer items-center gap-2.5', className)}>
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={value}
		aria-label={label}
		{disabled}
		onclick={handleClick}
		class={twMerge(
			'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-150',
			'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
			dims[size].track,
			value ? 'bg-accent' : 'bg-bg-inset',
			disabled && 'cursor-not-allowed opacity-60'
		)}
	>
		<span
			class={twMerge(
				'inline-block transform rounded-full bg-white shadow-sm transition-transform duration-150',
				dims[size].dot,
				value ? dims[size].on : 'translate-x-0.5'
			)}
		></span>
	</button>
	{#if label}
		<span class="text-sm text-fg">{label}</span>
	{/if}
</label>
