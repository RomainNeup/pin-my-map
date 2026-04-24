<script lang="ts">
	import { confirmRequest, resolveConfirm } from '$lib/stores/confirm';
	import Dialog from './Dialog.svelte';
	import Button from '../Button.svelte';

	let open = $derived(!!$confirmRequest);

	const cancel = () => {
		if ($confirmRequest) resolveConfirm($confirmRequest.id, false);
	};
	const confirm = () => {
		if ($confirmRequest) resolveConfirm($confirmRequest.id, true);
	};
</script>

{#snippet body()}
	{#if $confirmRequest?.message}
		<p class="text-sm text-fg-muted">{$confirmRequest.message}</p>
	{/if}
{/snippet}

{#snippet foot()}
	<Button variant="ghost" tone="neutral" onclick={cancel}
		>{$confirmRequest?.cancelLabel ?? 'Cancel'}</Button
	>
	<Button
		variant="solid"
		tone={$confirmRequest?.tone === 'danger' ? 'danger' : 'accent'}
		onclick={confirm}>{$confirmRequest?.confirmLabel ?? 'Confirm'}</Button
	>
{/snippet}

<Dialog {open} title={$confirmRequest?.title} onClose={cancel} children={body} footer={foot} />
