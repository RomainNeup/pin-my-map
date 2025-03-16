<script lang="ts">
	import { login } from '$lib/api/auth';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { setError } from '$lib/store/error';
	import { accessToken } from '$lib/store/user';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
    let token = $accessToken;

	const handleLogin = () => {
        if (!email || !password) {
            let missingFields = [];
            if (!email) missingFields.push('email');
            if (!password) missingFields.push('password');
            setError(`The following fields are required: ${missingFields.join(', ')}`);
            return;
        }
		login(email, password)
			.then((response) => {
                window.location.href = '/';
			})
			.catch((error) => {
                setError(error.response.data.message);
            });
	}

    onMount(() => {
        token && (window.location.href = '/');
    });
</script>

<div class="flex flex-col space-y-4">
	<h1 class="text-2xl font-bold">Login</h1>
    <form class="flex flex-col space-y-4" on:submit|preventDefault={handleLogin}>
        <Input placeholder="Email" type="email" bind:value={email} />
        <Input placeholder="Password" type="password" bind:value={password} />
        <Button type="submit">Login</Button>
        <a href="/register" class="text-blue-500">Don't have an account?</a>
    </form>
</div>
