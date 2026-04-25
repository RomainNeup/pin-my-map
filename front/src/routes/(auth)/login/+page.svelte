<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { login, oauthGoogle, oauthApple } from '$lib/api/auth';
	import { accessToken } from '$lib/stores/user';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Field from '$lib/components/ui/Field.svelte';

	let email = $state('');
	let password = $state('');
	let emailError = $state('');
	let passwordError = $state('');
	let submitting = $state(false);
	let oauthSubmitting = $state<'google' | 'apple' | null>(null);

	const googleClientId = env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
	const appleClientId = env.PUBLIC_APPLE_OAUTH_CLIENT_ID;
	const appleRedirectURI = env.PUBLIC_APPLE_OAUTH_REDIRECT_URI;

	const showGoogle = !!googleClientId;
	const showApple = !!(appleClientId && appleRedirectURI);
	const showDivider = showGoogle || showApple;

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

	const handleGoogleSignIn = async () => {
		if (oauthSubmitting) return;
		oauthSubmitting = 'google';
		try {
			const { signInWithGoogle } = await import('$lib/oauth/google');
			const idToken = await signInWithGoogle(googleClientId!);
			await oauthGoogle(idToken);
			goto('/');
		} catch {
			// errors are toasted by the axios interceptor or the sign-in helper
		} finally {
			oauthSubmitting = null;
		}
	};

	const handleAppleSignIn = async () => {
		if (oauthSubmitting) return;
		oauthSubmitting = 'apple';
		try {
			const { signInWithApple } = await import('$lib/oauth/apple');
			const { idToken, name } = await signInWithApple({
				clientId: appleClientId!,
				redirectURI: appleRedirectURI!
			});
			await oauthApple(idToken, name);
			goto('/');
		} catch {
			// errors are toasted by the axios interceptor or the sign-in helper
		} finally {
			oauthSubmitting = null;
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
			<Button type="submit" fullwidth loading={submitting}>Sign in</Button>
		</form>

		{#if showDivider}
			<div class="my-4 flex items-center gap-3">
				<hr class="flex-1 border-border" />
				<span class="text-xs text-fg-subtle">or</span>
				<hr class="flex-1 border-border" />
			</div>

			<div class="space-y-3">
				{#if showGoogle}
					<button
						type="button"
						onclick={handleGoogleSignIn}
						disabled={!!oauthSubmitting}
						class="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if oauthSubmitting === 'google'}
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
							</svg>
						{:else}
							<!-- Google "G" logo -->
							<svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
						{/if}
						Continue with Google
					</button>
				{/if}

				{#if showApple}
					<button
						type="button"
						onclick={handleAppleSignIn}
						disabled={!!oauthSubmitting}
						class="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-[#000] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if oauthSubmitting === 'apple'}
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
							</svg>
						{:else}
							<!-- Apple logo -->
							<svg class="h-4 w-4" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
								<path
									d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 790.8 0 663.4 0 541.8c0-194.3 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
								/>
							</svg>
						{/if}
						Continue with Apple
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<p class="text-center text-sm text-fg-muted">
		Don't have an account?
		<a href="/register" class="font-medium text-accent hover:underline">Create one</a>
	</p>
</div>
