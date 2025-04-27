<script lang="ts">
	import { EmojiButton } from '@joeattardi/emoji-button';

	interface EmojiPickerProps {
		/** Function to dispatch the selected emoji */
		onChange?: (emoji: string) => void;
        /** Selected emoji */
        value?: string;
	}

	let {
        onChange,
        value = $bindable(''),
    }: EmojiPickerProps = $props();

	const picker = new EmojiButton({style: 'native', zIndex: 1000});
	let trigger: HTMLButtonElement;

	picker.on('emoji', (selection) => {
        value = selection.emoji;
		if (onChange) {
			onChange(selection.emoji);
		}
	});

	function togglePicker() {
		picker.togglePicker(trigger);
	}
</script>

<button bind:this={trigger} onclick={togglePicker}>
    {value || '😀'}
</button>
