<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createPlaceComment,
		deletePlaceComment,
		listPlaceComments,
		type PlaceComment
	} from '$lib/api/placeComment';
	import { currentUser } from '$lib/stores/user';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Trash from 'lucide-svelte/icons/trash-2';
	import { toast } from '$lib/stores/toast';

	type Props = { savedPlaceId: string; ownerUserId?: string };
	let { savedPlaceId, ownerUserId }: Props = $props();

	let comments = $state<PlaceComment[]>([]);
	let loading = $state(false);
	let posting = $state(false);
	let body = $state('');

	const load = async () => {
		loading = true;
		try {
			comments = await listPlaceComments(savedPlaceId);
		} catch {
			comments = [];
		} finally {
			loading = false;
		}
	};

	onMount(load);

	const submit = async () => {
		const trimmed = body.trim();
		if (!trimmed) return;
		posting = true;
		try {
			const c = await createPlaceComment(savedPlaceId, trimmed);
			comments = [...comments, c];
			body = '';
		} finally {
			posting = false;
		}
	};

	const remove = async (id: string) => {
		try {
			await deletePlaceComment(id);
			comments = comments.filter((c) => c.id !== id);
			toast('Comment removed', 'success');
		} catch {
			// interceptor toasts
		}
	};

	const canDelete = (c: PlaceComment) =>
		!!$currentUser && ($currentUser.id === c.authorId || $currentUser.id === ownerUserId);

	const formatDate = (iso: string) => new Date(iso).toLocaleString();
</script>

<section class="space-y-3 rounded-xl border border-border bg-bg-elevated p-4">
	<h2 class="font-semibold text-fg">Comments ({comments.length})</h2>

	{#if loading}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if comments.length === 0}
		<p class="text-sm text-fg-muted">No comments yet. Be the first!</p>
	{:else}
		<ul class="space-y-3">
			{#each comments as c}
				<li class="rounded-lg bg-bg-muted p-3">
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<div class="text-sm font-medium text-fg">
								{#if c.authorSlug}
									<a class="hover:underline" href={`/u/${c.authorSlug}`}>{c.authorName}</a>
								{:else}
									{c.authorName}
								{/if}
								<span class="ml-2 text-xs font-normal text-fg-muted">{formatDate(c.createdAt)}</span>
							</div>
							<p class="mt-1 whitespace-pre-wrap text-sm text-fg">{c.body}</p>
						</div>
						{#if canDelete(c)}
							<button
								class="rounded p-1 text-fg-muted hover:bg-bg-elevated hover:text-danger"
								aria-label="Delete comment"
								onclick={() => remove(c.id)}
							>
								<Trash class="h-4 w-4" />
							</button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	{#if $currentUser}
		<div class="space-y-2 pt-2">
			<Input bind:value={body} type="textarea" placeholder="Leave a comment…" />
			<div class="flex justify-end">
				<Button variant="solid" tone="accent" loading={posting} onclick={submit}>Post</Button>
			</div>
		</div>
	{:else}
		<p class="text-xs text-fg-muted">
			<a class="text-accent hover:underline" href="/login">Sign in</a> to leave a comment.
		</p>
	{/if}
</section>
