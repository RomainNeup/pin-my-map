<script lang="ts">
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		label?: string;
		id?: string;
		value?: boolean;
		onChange?: (value: boolean) => void;
	};

	var toggle: HTMLInputElement;
	var toggleDot: HTMLDivElement;
	var toggleBox: HTMLDivElement;

	let { label, id, value = $bindable(), onChange }: Props = $props();

	const handleChange = () => {
		if (onChange) {
			onChange(toggle.checked);
		}
		toggleDot.classList.toggle('translate-x-6');

		if (toggle.checked) {
			toggleBox.classList.remove('bg-red-400');
			toggleBox.classList.add('bg-green-400');
		} else {
			toggleBox.classList.remove('bg-green-400');
			toggleBox.classList.add('bg-red-400');
		}
	};

	onMount(() => {
		toggle.addEventListener('change', handleChange);
	});

	const toogleBoxBaseClass = twMerge(
		'h-6 w-12 rounded-full',
		value ? 'bg-green-400' : 'bg-red-400'
	);

	const toogleDotBaseClass = twMerge(
		'toggle-dot m-0.5 h-5 w-5 transform rounded-full bg-white text-center shadow-md transition-all duration-300 ease-in-out',
		value ? 'translate-x-6' : ''
	);
</script>

<div>
	<input
		type="checkbox"
		class="hidden"
		bind:this={toggle}
		id={id || 'toggle'}
		bind:checked={value}
	/>
	<label for={id || 'toggle'} class="flex cursor-pointer items-center">
		<div class={toogleBoxBaseClass} bind:this={toggleBox}>
			<div
				class={toogleDotBaseClass}
				bind:this={toggleDot}
			></div>
		</div>
		{#if label}
			<div class="ml-3 font-medium text-gray-700">{label}</div>
		{/if}
	</label>
</div>
