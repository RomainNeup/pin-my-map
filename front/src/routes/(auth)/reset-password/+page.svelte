<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { resetPassword } from '$lib/api/auth';
	import { toast } from '$lib/stores/toast';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';

	let token = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordError = $state('');
	let confirmError = $state('');
	let inlineError = $state('');
	let submitting = $state(false);

	onMount(() => {
		token = $page.url.searchParams.get('token') ?? '';
		if (!token) {
			goto('/forgot-password');
		}
	});

	const validate = () => {
		passwordError =
			newPassword.length === 0
				? 'Password is required'
				: newPassword.length < 8
					? 'Password must be at least 8 characters'
					: '';
		confirmError =
			confirmPassword.length === 0
				? 'Please confirm your password'
				: newPassword !== confirmPassword
					? 'Passwords do not match'
					: '';
		return !(passwordError || confirmError);
	};

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		inlineError = '';
		if (!validate()) return;

		submitting = true;
		try {
			await resetPassword(token, newPassword);
			toast('Password updated — please sign in', 'success');
			goto('/login');
		} catch {
			inlineError = 'This reset link is invalid or has expired.';
		} finally {
			submitting = false;
		}
	};
</script>

<div class="space-y-6">
	<div class="flex flex-col items-center gap-2 text-center">
		<span
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-md"
		>
			<MapPin class="h-6 w-6" />
		</span>
		<h1 class="text-2xl font-semibold">Reset your password</h1>
		<p class="text-sm text-fg-muted">Choose a new password for your account.</p>
	</div>

	<div class="rounded-2xl border border-border bg-bg-elevated p-6 shadow-lg">
		<form class="space-y-4" onsubmit={handleSubmit}>
			{#if inlineError}
				<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
					{inlineError}
				</p>
			{/if}
			<Field label="New password" required error={passwordError}>
				{#snippet children({ id })}
					<Input
						{id}
						type="password"
						placeholder="At least 8 characters"
						autocomplete="new-password"
						bind:value={newPassword}
						error={!!passwordError}
					/>
				{/snippet}
			</Field>
			<Field label="Confirm password" required error={confirmError}>
				{#snippet children({ id })}
					<Input
						{id}
						type="password"
						placeholder="Repeat password"
						autocomplete="new-password"
						bind:value={confirmPassword}
						error={!!confirmError}
					/>
				{/snippet}
			</Field>
			<Button type="submit" fullwidth loading={submitting}>Set new password</Button>
		</form>
	</div>

	<p class="text-center text-sm text-fg-muted">
		<a href="/login" class="font-medium text-accent hover:underline">Back to sign in</a>
	</p>
</div>
