<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface StarRatingProps {
		rating?: number;
		maxStars?: number;
		disabled?: boolean;
		size?: string;
		allowHalf?: boolean;
		onChange?: (value: number) => void;
	}

	let {
		rating = $bindable(0),
		maxStars = 5,
		disabled = false,
		size = '1.5rem',
		allowHalf = false,
		onChange
	}: StarRatingProps = $props();

	let hoverValue = $state(-1);

	function handleClick(value: number, event: MouseEvent) {
		if (disabled) return;
		let next = value;
		if (allowHalf) {
			const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
			const halfPoint = rect.left + rect.width / 2;
			next = event.clientX < halfPoint ? value - 0.5 : value;
		}
		onChange?.(next);
		rating = next;
	}

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

	function handleMouseLeave() {
		hoverValue = -1;
	}

	function getStarClasses(starValue: number) {
		const displayValue = hoverValue >= 0 ? hoverValue : rating;
		const isFilled = starValue <= displayValue;
		const isHalf = !isFilled && starValue - 0.5 <= displayValue;

		return twMerge(
			'relative cursor-pointer bg-transparent p-0 leading-none transition-colors duration-150',
			'focus-visible:outline-none',
			isFilled ? 'text-amber-400' : isHalf ? 'half-star text-amber-400' : 'text-fg-subtle',
			disabled && 'cursor-not-allowed opacity-60'
		);
	}

	$effect(() => {
		if (rating < 0) rating = 0;
		if (rating > maxStars) rating = maxStars;
	});
</script>

<div
	class="inline-flex gap-1"
	onmouseleave={handleMouseLeave}
	role="radiogroup"
	tabindex={disabled ? -1 : 0}
	aria-label={`Rating: ${rating} out of ${maxStars} stars`}
>
	{#each Array(maxStars) as _u, i}
		{@const starValue = i + 1}
		<button
			class={getStarClasses(starValue)}
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
		</button>
	{/each}
</div>

<style>
	.half-star::before {
		content: '★';
		position: absolute;
		left: 0;
		top: 0;
		width: 50%;
		overflow: hidden;
		color: inherit;
	}
</style>
