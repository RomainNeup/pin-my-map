<script lang="ts">
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { forgotPassword } from '$lib/api/auth';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';

	let email = $state('');
	let emailError = $state('');
	let submitting = $state(false);
	let sent = $state(false);

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		emailError = email ? '' : 'Email is required';
		if (emailError) return;

		submitting = true;
		try {
			await forgotPassword(email);
		} catch {
			// silently ignore — always show the neutral message
		} finally {
			submitting = false;
			sent = true;
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
		<h1 class="text-2xl font-semibold">Forgot password?</h1>
		<p class="text-sm text-fg-muted">We'll send you a link to reset it.</p>
	</div>

	<div class="rounded-2xl border border-border bg-bg-elevated p-6 shadow-lg">
		{#if sent}
			<p class="text-center text-sm text-fg-muted">
				If that email exists in our system, we've sent a reset link. Check your inbox.
			</p>
		{:else}
			<form class="space-y-4" onsubmit={handleSubmit}>
				<Field label="Email" required error={emailError}>
					{#snippet children({ id })}
						<Input
							{id}
							type="email"
							placeholder="you@example.com"
							autocomplete="email"
							bind:value={email}
							error={!!emailError}
						/>
					{/snippet}
				</Field>
				<Button type="submit" fullwidth loading={submitting}>Send reset link</Button>
			</form>
		{/if}
	</div>

	<p class="text-center text-sm text-fg-muted">
		Remembered it?
		<a href="/login" class="font-medium text-accent hover:underline">Sign in</a>
	</p>
</div>
