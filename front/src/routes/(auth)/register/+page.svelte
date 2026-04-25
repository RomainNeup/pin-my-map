<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { register } from '$lib/api/auth';
	import { accessToken } from '$lib/stores/user';
	import { toast } from '$lib/stores/toast';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');

	let nameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let confirmError = $state('');
	let submitting = $state(false);

	const validate = () => {
		nameError = name ? '' : 'Name is required';
		emailError = email ? '' : 'Email is required';
		passwordError = password ? '' : 'Password is required';
		confirmError = passwordConfirmation
			? password === passwordConfirmation
				? ''
				: 'Passwords do not match'
			: 'Please confirm your password';
		return !(nameError || emailError || passwordError || confirmError);
	};

	const handleRegister = async (event: Event) => {
		event.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			await register(name, email, password);
			toast('Account created — please sign in', 'success');
			goto('/login');
		} catch {
			// toasted by interceptor
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
		<h1 class="text-2xl font-semibold">Create your account</h1>
		<p class="text-sm text-fg-muted">Start collecting places you love.</p>
	</div>

	<div class="rounded-2xl border border-border bg-bg-elevated p-6 shadow-lg">
		<form class="space-y-4" onsubmit={handleRegister}>
			<Field label="Name" required error={nameError}>
				{#snippet children({ id })}
					<Input
						{id}
						type="text"
						placeholder="Jane Doe"
						autocomplete="name"
						bind:value={name}
						error={!!nameError}
					/>
				{/snippet}
			</Field>
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
						placeholder="At least 8 characters"
						autocomplete="new-password"
						bind:value={password}
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
						bind:value={passwordConfirmation}
						error={!!confirmError}
					/>
				{/snippet}
			</Field>
			<Button type="submit" fullwidth loading={submitting}>Create account</Button>
		</form>
	</div>

	<p class="text-center text-sm text-fg-muted">
		Already have an account?
		<a href="/login" class="font-medium text-accent hover:underline">Sign in</a>
	</p>
</div>
