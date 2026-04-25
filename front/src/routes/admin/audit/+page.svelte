<script lang="ts">
	import { listAudit, type AuditLog } from '$lib/api/audit';
	import Input from '$lib/components/Input.svelte';
	import { onMount } from 'svelte';

	let logs = $state<AuditLog[]>([]);
	let loading = $state(false);
	let action = $state('');
	let targetType = $state('');

	const load = async () => {
		loading = true;
		try {
			logs = await listAudit({
				action: action.trim() || undefined,
				targetType: targetType.trim() || undefined,
				limit: 200
			});
		} finally {
			loading = false;
		}
	};

	onMount(load);

	let expanded = $state<Record<string, boolean>>({});
	const toggle = (id: string) => (expanded = { ...expanded, [id]: !expanded[id] });
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
		<Input bind:value={action} placeholder="Filter by action (e.g. suggestion.approve)" />
		<Input bind:value={targetType} placeholder="Filter by target type (suggestion|user|place)" />
		<button
			class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-bg-muted"
			onclick={load}
		>
			Apply
		</button>
	</div>

	{#if loading}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if logs.length === 0}
		<p class="text-sm text-fg-muted">No entries.</p>
	{:else}
		<ul class="space-y-2">
			{#each logs as log (log.id)}
				<li class="rounded-lg border border-border bg-bg-elevated p-3 text-sm">
					<button
						class="flex w-full items-center justify-between gap-3 text-left"
						onclick={() => toggle(log.id)}
					>
						<div>
							<p>
								<span class="font-mono text-xs">{log.action}</span>
								<span class="text-fg-muted">
									· {log.targetType}{log.targetId ? `/${log.targetId}` : ''}</span
								>
							</p>
							<p class="text-xs text-fg-muted">
								{log.actorName ?? log.actorEmail ?? log.actorId} · {new Date(
									log.createdAt
								).toLocaleString()}
							</p>
						</div>
						<span class="text-xs text-fg-muted">{expanded[log.id] ? '▾' : '▸'}</span>
					</button>
					{#if expanded[log.id]}
						<div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
							{#if log.before}
								<pre class="overflow-auto rounded bg-bg-muted p-2 text-xs">before: {JSON.stringify(
										log.before,
										null,
										2
									)}</pre>
							{/if}
							{#if log.after}
								<pre class="overflow-auto rounded bg-bg-muted p-2 text-xs">after: {JSON.stringify(
										log.after,
										null,
										2
									)}</pre>
							{/if}
							{#if log.meta}
								<pre
									class="overflow-auto rounded bg-bg-muted p-2 text-xs md:col-span-2">meta: {JSON.stringify(
										log.meta,
										null,
										2
									)}</pre>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
