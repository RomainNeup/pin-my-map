<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  
  interface Props {
    rating?: number;
    maxStars?: number;
    disabled?: boolean;
    size?: string;
    onChange?: (value: number) => void;
  }

  let {
    rating = 0,
    maxStars = 5,
    disabled = false,
    size = "1.5rem",
    onChange
  }: Props = $props();
  
  // Use a number instead of index, null means no hover
  let hoverValue: number = -1;
  
  function handleClick(value: number) {
    if (!disabled) {
      onChange?.(value);
      rating = value;
    }
  }

  function handleMouseEnter(value: number) {
    console.log(value);
    if (!disabled) {
      hoverValue = value;
    }
  }

  function handleMouseLeave() {
    hoverValue = -1;
  }

  function getStarClasses(starValue: number, isDisabled: boolean) {
    const isFilled = starValue <= rating || starValue <= hoverValue;
    
    return twMerge(
      "bg-transparent border-0 p-0 cursor-pointer transition-colors duration-200 leading-none focus:outline-none",
      isFilled ? "text-amber-400" : "text-gray-300",
      isDisabled && "cursor-not-allowed opacity-60"
    );
  }
</script>

<div 
  class="inline-flex gap-1" 
  on:mouseleave={handleMouseLeave} 
  style="--star-size: {size}"
  role="group"
  aria-label="Star rating"
>
  {#each Array(maxStars) as _, i}
    {@const starValue = i + 1}
    <button
      class={getStarClasses(starValue, disabled)}
      style={`font-size: ${size}`}
      on:click={() => handleClick(starValue)}
      on:mouseenter={() => handleMouseEnter(starValue)}
      type="button"
      aria-label="Rate {starValue} out of {maxStars} stars"
    >
      ★
    </button>
  {/each}
</div>