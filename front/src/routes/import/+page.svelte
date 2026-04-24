<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { importMapstr, type ImportSummary } from '$lib/api/import';
	import { toast } from '$lib/stores/toast';
	import Upload from 'lucide-svelte/icons/upload';
	import FileJson from 'lucide-svelte/icons/file-json';

	let file = $state<File | null>(null);
	let submitting = $state(false);
	let summary = $state<ImportSummary | null>(null);
	let showErrors = $state(false);

	function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
		summary = null;
	}

	async function onSubmit(event: Event) {
		event.preventDefault();
		if (!file || submitting) return;

		submitting = true;
		try {
			summary = await importMapstr(file);
			toast(
				`Imported ${summary.imported} place${summary.imported === 1 ? '' : 's'} ` +
					`(skipped ${summary.skipped}, failed ${summary.failed})`,
				summary.failed > 0 ? 'error' : 'success'
			);
		} catch {
			// axios interceptor already surfaced a toast
		} finally {
			submitting = false;
		}
	}
</script>

{#snippet uploadIcon()}<Upload class="h-4 w-4" />{/snippet}

<div class="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">Import from Mapstr</h1>
		<p class="mt-1 text-sm text-fg-muted">
			Mapstr emails you a zip archive with your export. Extract it and upload the
			<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">.geojson</code> file below. Already-saved
			places will be skipped.
		</p>
	</div>

	<form class="rounded-xl border border-border bg-bg-elevated p-5 shadow-sm" onsubmit={onSubmit}>
		<label
			class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg p-6 text-center transition-colors hover:border-accent"
		>
			<FileJson class="h-8 w-8 text-fg-muted" />
			<span class="text-sm font-medium text-fg">
				{file ? file.name : 'Choose a Mapstr GeoJSON file'}
			</span>
			<span class="text-xs text-fg-muted">
				{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Click to browse'}
			</span>
			<input
				type="file"
				accept=".geojson,application/geo+json,application/json"
				class="hidden"
				onchange={onFileChange}
			/>
		</label>

		<div class="mt-5 flex items-center justify-end gap-2">
			<Button variant="ghost" tone="neutral" onclick={() => goto('/saved/list')}>Cancel</Button>
			<Button
				type="submit"
				variant="solid"
				tone="accent"
				disabled={!file || submitting}
				loading={submitting}
				prefix={uploadIcon}
			>
				{submitting ? 'Importing…' : 'Import'}
			</Button>
		</div>
	</form>

	{#if summary}
		<div class="mt-6 rounded-xl border border-border bg-bg-elevated p-5 shadow-sm">
			<h2 class="mb-3 text-lg font-semibold text-fg">Import summary</h2>
			<dl class="grid grid-cols-3 gap-4 text-center">
				<div>
					<dt class="text-xs uppercase tracking-wide text-fg-muted">Imported</dt>
					<dd class="mt-1 text-2xl font-semibold text-fg">{summary.imported}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wide text-fg-muted">Skipped</dt>
					<dd class="mt-1 text-2xl font-semibold text-fg">{summary.skipped}</dd>
				</div>
				<div>
					<dt class="text-xs uppercase tracking-wide text-fg-muted">Failed</dt>
					<dd class="mt-1 text-2xl font-semibold text-fg">{summary.failed}</dd>
				</div>
			</dl>

			{#if summary.errors.length > 0}
				<div class="mt-4">
					<button
						type="button"
						class="text-sm text-accent hover:underline"
						onclick={() => (showErrors = !showErrors)}
					>
						{showErrors ? 'Hide' : 'Show'}
						{summary.errors.length} error{summary.errors.length === 1 ? '' : 's'}
					</button>
					{#if showErrors}
						<ul
							class="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-bg p-3 text-xs"
						>
							{#each summary.errors as err (err.index)}
								<li class="py-0.5 text-fg-muted">
									<span class="font-mono">#{err.index}</span>
									{#if err.name}<span class="text-fg">{err.name}</span>{/if}
									— {err.message}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			<div class="mt-5 flex gap-2">
				<Button variant="solid" tone="accent" href="/">View on map</Button>
				<Button variant="soft" tone="neutral" href="/saved/list">Open saved list</Button>
			</div>
		</div>
	{/if}
</div>
