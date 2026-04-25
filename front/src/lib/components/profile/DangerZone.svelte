<script lang="ts">
	import { goto } from '$app/navigation';
	import KeyRound from 'lucide-svelte/icons/key-round';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { changePassword, deleteMe } from '$lib/api/user';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { toast } from '$lib/stores/toast';
	import { confirm } from '$lib/stores/confirm';
	import { accessToken } from '$lib/stores/user';

	// --- change password ---
	let cpOpen = $state(false);
	let cpCurrent = $state('');
	let cpNew = $state('');
	let cpConfirm = $state('');
	let cpLoading = $state(false);
	let cpError = $state('');

	const toggleCp = () => {
		cpOpen = !cpOpen;
		cpCurrent = '';
		cpNew = '';
		cpConfirm = '';
		cpError = '';
	};

	const submitChangePassword = async () => {
		cpError = '';
		if (cpNew !== cpConfirm) {
			cpError = 'New passwords do not match.';
			return;
		}
		if (cpNew.length < 8) {
			cpError = 'New password must be at least 8 characters.';
			return;
		}
		cpLoading = true;
		try {
			await changePassword({ currentPassword: cpCurrent, newPassword: cpNew });
			toast('Password updated.', 'success');
			toggleCp();
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status;
			cpError = status === 401 ? 'Current password is incorrect.' : 'Failed to update password.';
		} finally {
			cpLoading = false;
		}
	};

	// --- delete account ---
	let delPassword = $state('');
	let delLoading = $state(false);
	let delOpen = $state(false);
	let delError = $state('');

	const openDeleteModal = () => {
		delPassword = '';
		delError = '';
		delOpen = true;
	};

	const closeDeleteModal = () => {
		delOpen = false;
		delPassword = '';
		delError = '';
	};

	const submitDelete = async () => {
		delError = '';
		const confirmed = await confirm({
			title: 'Delete your account?',
			message:
				'This action is permanent. Your saved places, tags, and data will be anonymised. Are you sure?',
			confirmLabel: 'Yes, delete',
			cancelLabel: 'Cancel',
			tone: 'danger'
		});
		if (!confirmed) return;

		delLoading = true;
		try {
			await deleteMe(delPassword);
			accessToken.set(null);
			goto('/login');
		} catch (err: unknown) {
			const status = (err as { response?: { status?: number } })?.response?.status;
			delError = status === 401 ? 'Password is incorrect.' : 'Failed to delete account.';
		} finally {
			delLoading = false;
		}
	};
</script>

<section class="rounded-xl border border-danger/30 bg-danger-soft/30 p-5">
	<h2 class="mb-4 text-lg font-semibold text-danger">Danger zone</h2>

	<!-- Change password -->
	<div class="mb-4">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium">Change password</p>
				<p class="text-xs text-fg-muted">Update your login password.</p>
			</div>
			<Button variant="outline" tone="neutral" size="sm" onclick={toggleCp}>
				{#snippet prefix()}<KeyRound class="h-4 w-4" />{/snippet}
				{cpOpen ? 'Cancel' : 'Change'}
			</Button>
		</div>

		{#if cpOpen}
			<form
				class="mt-4 space-y-3"
				onsubmit={(e) => {
					e.preventDefault();
					submitChangePassword();
				}}
			>
				<div>
					<label class="mb-1 block text-xs font-medium" for="cp-current">Current password</label>
					<Input id="cp-current" bind:value={cpCurrent} type="password" required autocomplete="current-password" />
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium" for="cp-new">New password</label>
					<Input id="cp-new" bind:value={cpNew} type="password" required autocomplete="new-password" />
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium" for="cp-confirm">Confirm new password</label>
					<Input id="cp-confirm" bind:value={cpConfirm} type="password" required autocomplete="new-password" error={!!cpError} />
				</div>
				{#if cpError}
					<p class="text-sm text-danger">{cpError}</p>
				{/if}
				<Button type="submit" tone="accent" loading={cpLoading}>Update password</Button>
			</form>
		{/if}
	</div>

	<hr class="border-danger/20" />

	<!-- Delete account -->
	<div class="mt-4">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium">Delete account</p>
				<p class="text-xs text-fg-muted">Permanently delete your account and anonymise your data.</p>
			</div>
			<Button variant="outline" tone="danger" size="sm" onclick={openDeleteModal}>
				{#snippet prefix()}<Trash2 class="h-4 w-4" />{/snippet}
				Delete
			</Button>
		</div>

		{#if delOpen}
			<form
				class="mt-4 space-y-3"
				onsubmit={(e) => {
					e.preventDefault();
					submitDelete();
				}}
			>
				<div>
					<label class="mb-1 block text-xs font-medium" for="del-password">Confirm your password to continue</label>
					<Input id="del-password" bind:value={delPassword} type="password" required autocomplete="current-password" error={!!delError} />
				</div>
				{#if delError}
					<p class="text-sm text-danger">{delError}</p>
				{/if}
				<div class="flex gap-2">
					<Button type="submit" tone="danger" loading={delLoading}>Delete my account</Button>
					<Button variant="ghost" tone="neutral" onclick={closeDeleteModal}>Cancel</Button>
				</div>
			</form>
		{/if}
	</div>
</section>
