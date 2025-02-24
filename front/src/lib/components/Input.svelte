<script lang="ts">
	interface Props {
		value: string;
		placeholder: string;
		type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea';
	}

	let { value = $bindable(), placeholder, type, ...props }: Props = $props();
</script>

{#if type === 'textarea'}
	<textarea
		class="border-primary focus:ring-primary focus:border-primary rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 w-full"
		{placeholder}
		bind:value
        {...props}
	></textarea>
{:else}
	<input
		class="border-primary focus:ring-primary focus:border-primary rounded-full border px-4 py-2 focus:outline-none focus:ring-2"
		{placeholder}
		bind:value
		type={type ?? 'text'}
        {...props}
	/>
{/if}
