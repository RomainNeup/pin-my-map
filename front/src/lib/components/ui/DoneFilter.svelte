<script lang="ts">
	export type DoneFilterValue = 'all' | 'todo' | 'done';

	interface Props {
		value: DoneFilterValue;
		onChange: (value: DoneFilterValue) => void;
	}

	let { value, onChange }: Props = $props();

	const options: { label: string; value: DoneFilterValue }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'To-do', value: 'todo' },
		{ label: 'Done', value: 'done' }
	];
</script>

<div
	class="inline-flex shrink-0 items-center rounded-lg border border-border bg-bg-elevated p-0.5 text-sm"
>
	{#each options as opt (opt.value)}
		<button
			type="button"
			class="rounded-md px-2.5 py-1 font-medium transition-colors {value === opt.value
				? 'bg-accent text-accent-fg shadow-sm'
				: 'text-fg-muted hover:text-fg'}"
			onclick={() => onChange(opt.value)}
			aria-pressed={value === opt.value}
		>
			{opt.label}
		</button>
	{/each}
</div>
