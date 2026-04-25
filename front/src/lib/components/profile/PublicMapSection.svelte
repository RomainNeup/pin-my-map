<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		checkSlugAvailability,
		getPublicMapSettings,
		rotatePublicToken,
		updatePublicMapSettings,
		type PublicMapSettings
	} from '$lib/api/user';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
	import { toast } from '$lib/stores/toast';

	let settings = $state<PublicMapSettings>({ isPublic: false });
	let slug = $state('');
	let slugStatus = $state<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
	let saving = $state(false);
	let rotating = $state(false);

	let slugTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		try {
			settings = await getPublicMapSettings();
			slug = settings.publicSlug ?? '';
		} catch {
			// handled by interceptor
		}
	});

	const origin = $derived(browser ? window.location.origin : '');
	const slugUrl = $derived(slug ? `${origin}/u/${slug}` : '');
	const tokenUrl = $derived(settings.publicToken ? `${origin}/public/${settings.publicToken}` : '');

	const onSlugInput = () => {
		if (slugTimer) clearTimeout(slugTimer);
		const candidate = slug.trim().toLowerCase();
		if (!candidate || candidate === settings.publicSlug) {
			slugStatus = 'idle';
			return;
		}
		slugStatus = 'checking';
		slugTimer = setTimeout(async () => {
			try {
				const { available } = await checkSlugAvailability(candidate);
				slugStatus = available ? 'available' : 'taken';
			} catch {
				slugStatus = 'invalid';
			}
		}, 350);
	};

	const save = async () => {
		saving = true;
		try {
			settings = await updatePublicMapSettings({
				isPublic: settings.isPublic,
				publicSlug: slug.trim() || undefined
			});
			slug = settings.publicSlug ?? '';
			toast('Public map settings saved', 'success');
		} catch {
			// interceptor toasts
		} finally {
			saving = false;
		}
	};

	const rotate = async () => {
		rotating = true;
		try {
			settings = await rotatePublicToken();
			toast('Unlisted link rotated', 'success');
		} finally {
			rotating = false;
		}
	};

	const copy = async (value: string) => {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			toast('Copied to clipboard', 'success');
		} catch {
			toast('Could not copy', 'error');
		}
	};
</script>

<div class="w-full space-y-6">
	<section class="space-y-3 rounded-xl border border-border bg-bg-elevated p-4">
		<h2 class="font-semibold text-fg">Vanity URL</h2>
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<span class="text-sm text-fg-muted">{origin}/u/</span>
			<Input bind:value={slug} placeholder="your-slug" onInput={onSlugInput} />
		</div>
		{#if slugStatus === 'checking'}
			<p class="text-xs text-fg-muted">Checking availability…</p>
		{:else if slugStatus === 'available'}
			<p class="text-xs text-success">Available</p>
		{:else if slugStatus === 'taken'}
			<p class="text-xs text-danger">This slug is already taken</p>
		{:else if slugStatus === 'invalid'}
			<p class="text-xs text-danger">Use 3-30 chars, lowercase letters/digits/hyphens</p>
		{/if}

		<Toggle label="Make my map publicly discoverable at this URL" bind:value={settings.isPublic} />

		<div class="flex flex-wrap gap-2">
			<Button variant="solid" tone="accent" loading={saving} onclick={save}>Save</Button>
			{#if settings.publicSlug && settings.isPublic && slugUrl}
				<Button variant="outline" tone="neutral" onclick={() => copy(slugUrl)}>
					Copy public URL
				</Button>
				<Button variant="ghost" tone="neutral" href={slugUrl}>Open</Button>
			{/if}
		</div>
	</section>

	<section class="space-y-3 rounded-xl border border-border bg-bg-elevated p-4">
		<h2 class="font-semibold text-fg">Unlisted link</h2>
		<p class="text-sm text-fg-muted">
			Anyone with this link can view your map even when "publicly discoverable" is off. Rotate it to
			invalidate the previous link.
		</p>
		{#if tokenUrl}
			<code class="block break-all rounded bg-bg-muted px-2 py-1 text-xs text-fg-muted">
				{tokenUrl}
			</code>
		{/if}
		<div class="flex flex-wrap gap-2">
			{#if tokenUrl}
				<Button variant="outline" tone="neutral" onclick={() => copy(tokenUrl)}>
					Copy unlisted link
				</Button>
				<Button variant="ghost" tone="neutral" href={tokenUrl}>Open</Button>
			{/if}
			<Button variant="ghost" tone="danger" loading={rotating} onclick={rotate}>Rotate link</Button>
		</div>
	</section>
</div>
