<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import Button from './Button.svelte';

	/**
	 * Props interface for BackButton component
	 */
	interface BackButtonProps {
		/** URL to navigate to when clicked */
		href?: string;
		/** Text to display next to the back arrow */
		text?: string;
		/** Function called when button is clicked */
		onClick?: () => void;
		/** Color theme for the button */
		color?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
		/** Whether to use outline style */
		outline?: boolean;
		/** Size of the button */
		size?: 'small' | 'medium' | 'large';
		/** Additional CSS classes */
		className?: string;
	}

	// Props with defaults
	const {
		href = '/',
		text = 'Back',
		onClick,
		color = 'primary',
		outline = true,
		size = 'small',
		className = ''
	}: BackButtonProps = $props();
</script>

<Button
	{href}
	{onClick}
	{color}
	{outline}
	{size}
	prefix="←"
	rounded="lg"
	className={twMerge('mb-2', className)}
>
	{text}
</Button>