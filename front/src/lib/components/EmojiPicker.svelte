<script lang="ts">
	import { onMount } from 'svelte';
	import { EmojiButton } from '@joeattardi/emoji-button';

	interface EmojiPickerProps {
		/** Function to dispatch the selected emoji */
		onChange?: (emoji: string) => void;
		/** Selected emoji */
		value?: string;
	}

	let { onChange, value = $bindable('') }: EmojiPickerProps = $props();

	let trigger: HTMLButtonElement;
	let picker: EmojiButton | null = null;

	onMount(() => {
		picker = new EmojiButton({ style: 'native', zIndex: 1000 });
		picker.on('emoji', (selection) => {
			value = selection.emoji;
			onChange?.(selection.emoji);
		});

		return () => {
			picker?.destroyPicker();
			picker = null;
		};
	});

	function togglePicker() {
		picker?.togglePicker(trigger);
	}
</script>

<button bind:this={trigger} onclick={togglePicker}>
	{value || '😀'}
</button>
