<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { login } from '$lib/api/auth';
	import { accessToken } from '$lib/stores/user';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let submitting = $state(false);

	const handleLogin = async (event: Event) => {
		event.preventDefault();
		emailError = email ? '' : 'Email is required';
		passwordError = password ? '' : 'Password is required';
		if (emailError || passwordError) return;

		submitting = true;
		try {
			await login(email, password);
			goto('/');
		} catch {
			// axios interceptor toasts the error
		} finally {
			submitting = false;
		}
	};

	onMount(() => {
		if ($accessToken) goto('/');
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col items-center gap-2 text-center">
		<span
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-md"
		>
			<MapPin class="h-6 w-6" />
		</span>
		<h1 class="text-2xl font-semibold">Welcome back</h1>
		<p class="text-sm text-fg-muted">Sign in to continue pinning your map.</p>
	</div>

	<div class="rounded-2xl border border-border bg-bg-elevated p-6 shadow-lg">
		<form class="space-y-4" onsubmit={handleLogin}>
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
			<Field label="Password" required error={passwordError}>
				{#snippet children({ id })}
					<Input
						{id}
						type="password"
						placeholder="Your password"
						autocomplete="current-password"
						bind:value={password}
						error={!!passwordError}
					/>
				{/snippet}
			</Field>
			<div class="flex justify-end">
				<a href="/forgot-password" class="text-xs text-fg-muted hover:text-accent hover:underline"
					>Forgot password?</a
				>
			</div>
			<Button type="submit" fullwidth loading={submitting}>Sign in</Button>
		</form>

		<div class="my-4 flex items-center gap-3">
			<hr class="flex-1 border-border" />
			<span class="text-xs text-fg-subtle">or</span>
			<hr class="flex-1 border-border" />
		</div>
		<Button variant="outline" tone="neutral" fullwidth disabled>Continue with Google</Button>
	</div>

	<p class="text-center text-sm text-fg-muted">
		Don't have an account?
		<a href="/register" class="font-medium text-accent hover:underline">Create one</a>
	</p>
</div>
