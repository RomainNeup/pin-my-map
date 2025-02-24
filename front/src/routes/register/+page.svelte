<script lang="ts">
	import { register } from '$lib/api/auth';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { setError } from '$lib/store/error';
	import { accessToken } from '$lib/store/user';
	import { onMount } from 'svelte';

    let name = '';
	let email = '';
	let password = '';
    let passwordConfirmation = '';
    let token = $accessToken;

	const handleRegister = () => {
        if (password !== passwordConfirmation) {
            setError('Passwords do not match');
            return;
        }
        if (!name || !email || !password) {
            let missingFields = [];
            if (!name) missingFields.push('name');
            if (!email) missingFields.push('email');
            if (!password) missingFields.push('password');
            if (!passwordConfirmation) missingFields.push('password confirmation');
            setError(`The following fields are required: ${missingFields.join(', ')}`);
            return;
        }
		register(name, email, password)
			.then((response) => {
                window.location.href = '/login';
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
	<h1 class="text-2xl font-bold">Register</h1>
    <form class="flex flex-col space-y-4" on:submit|preventDefault={handleRegister}>
        <Input placeholder="Name" bind:value={name} />
        <Input placeholder="Email" type="email" bind:value={email} />
        <Input placeholder="Password" type="password" bind:value={password} />
        <Input placeholder="Confirm password" type="password" bind:value={passwordConfirmation} />
        <Button>Register</Button>
        <a href="/login" class="text-blue-500">Already have an account?</a>
    </form>
</div>
