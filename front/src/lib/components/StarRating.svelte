<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	/**
	 * Component Props Interface
	 */
	interface StarRatingProps {
		/** Current rating value (0-maxStars, can be decimal for half stars) */
		rating?: number;
		/** Maximum number of stars to display */
		maxStars?: number;
		/** Whether the rating control is disabled */
		disabled?: boolean;
		/** Size of star elements (CSS size value) */
		size?: string;
			/** Whether to allow half-star ratings */
		allowHalf?: boolean;
		/** Function called when rating value changes */
		onChange?: (value: number) => void;
	}

	// Props with defaults
	let {
		rating = $bindable(0),
		maxStars = 5,
		disabled = false,
		size = '1.5rem',
		allowHalf = false,
		onChange
	}: StarRatingProps = $props();

	// Component state
	let hoverValue = $state(-1);

	/**
	 * Handle star click to set rating
	 */
	function handleClick(value: number, event: MouseEvent) {
		if (disabled) return;
		
		if (allowHalf) {
			const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			const halfPoint = rect.left + rect.width / 2;
			value = event.clientX < halfPoint ? value - 0.5 : value;
		}
		
		onChange?.(value);
		rating = value;
	}

	/**
	 * Handle mouse enter for hover effect
	 */
	function handleMouseEnter(value: number, event: MouseEvent) {
		if (disabled) return;
		
		if (allowHalf) {
			const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			const halfPoint = rect.left + rect.width / 2;
			hoverValue = event.clientX < halfPoint ? value - 0.5 : value;
		} else {
			hoverValue = value;
		}
	}

	/**
	 * Handle mouse leave to reset hover state
	 */
	function handleMouseLeave() {
		hoverValue = -1;
	}

	/**
	 * Generate classes for star elements based on state
	 */
	function getStarClasses(starValue: number, isDisabled: boolean) {
		const displayValue = hoverValue >= 0 ? hoverValue : rating;
		const isFilled = starValue <= displayValue;
		const isHalfFilled = !isFilled && starValue - 0.5 <= displayValue;

		return twMerge(
			'bg-transparent border-0 p-0 cursor-pointer transition-colors duration-200 leading-none focus:outline-none relative',
			isFilled ? 'text-amber-400' : isHalfFilled ? 'half-star text-amber-400' : 'text-gray-300',
			isDisabled && 'cursor-not-allowed opacity-60'
		);
	}

	$effect(() => {
		// Clamp rating between 0 and maxStars
		if (rating < 0) rating = 0;
		if (rating > maxStars) rating = maxStars;
	});
</script>

<div
	class="inline-flex gap-1"
	onmouseleave={handleMouseLeave}
	style="--star-size: {size}"
	role="radiogroup"
	tabindex="0"
	aria-label={`Rating: ${rating} out of ${maxStars} stars`}
>
	{#each Array(maxStars) as _, i}
		{@const starValue = i + 1}
		<button
			class={getStarClasses(starValue, disabled)}
			style={`font-size: ${size}`}
			onclick={(e) => handleClick(starValue, e)}
			onmousemove={(e) => handleMouseEnter(starValue, e)}
			type="button"
			role="radio"
			aria-checked={starValue <= rating}
			aria-label={`${starValue} out of ${maxStars} stars`}
			aria-disabled={disabled}
			tabindex={disabled ? -1 : 0}
		>
			★
			{#if allowHalf}
				<span class="sr-only">Half star</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.half-star::before {
		content: "★";
		position: absolute;
		left: 0;
		top: 0;
		width: 50%;
		overflow: hidden;
		color: inherit;
	}
</style>
