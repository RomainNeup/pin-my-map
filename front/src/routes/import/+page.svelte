<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import {
		importMapstr,
		importGoogle,
		importPlacesCsv,
		type ImportSummary,
		type GoogleImportSummary,
		type CsvImportSummary
	} from '$lib/api/import';
	import { toast } from '$lib/stores/toast';
	import { isAdmin } from '$lib/stores/user';
	import Upload from 'lucide-svelte/icons/upload';
	import FileJson from 'lucide-svelte/icons/file-json';
	import FileText from 'lucide-svelte/icons/file-text';

	type Tab = 'mapstr' | 'google' | 'csv';

	let activeTab = $state<Tab>('mapstr');

	// Mapstr tab state
	let mapstrFile = $state<File | null>(null);
	let mapstrSubmitting = $state(false);
	let mapstrSummary = $state<ImportSummary | null>(null);
	let mapstrShowErrors = $state(false);

	// Google tab state
	let googleFile = $state<File | null>(null);
	let googleSubmitting = $state(false);
	let googleSummary = $state<GoogleImportSummary | null>(null);
	let googleShowErrors = $state(false);

	// CSV tab state
	let csvFile = $state<File | null>(null);
	let csvSubmitting = $state(false);
	let csvSummary = $state<CsvImportSummary | null>(null);
	let csvShowErrors = $state(false);

	function onMapstrFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		mapstrFile = input.files?.[0] ?? null;
		mapstrSummary = null;
	}

	function onGoogleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		googleFile = input.files?.[0] ?? null;
		googleSummary = null;
	}

	function onCsvFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		csvFile = input.files?.[0] ?? null;
		csvSummary = null;
	}

	async function onMapstrSubmit(event: Event) {
		event.preventDefault();
		if (!mapstrFile || mapstrSubmitting) return;
		mapstrSubmitting = true;
		try {
			mapstrSummary = await importMapstr(mapstrFile);
			toast(
				`Imported ${mapstrSummary.imported} place${mapstrSummary.imported === 1 ? '' : 's'} ` +
					`(skipped ${mapstrSummary.skipped}, failed ${mapstrSummary.failed})`,
				mapstrSummary.failed > 0 ? 'error' : 'success'
			);
		} catch {
			// axios interceptor already surfaced a toast
		} finally {
			mapstrSubmitting = false;
		}
	}

	async function onGoogleSubmit(event: Event) {
		event.preventDefault();
		if (!googleFile || googleSubmitting) return;
		googleSubmitting = true;
		try {
			googleSummary = await importGoogle(googleFile);
			toast(
				`Imported ${googleSummary.savedCreated} place${googleSummary.savedCreated === 1 ? '' : 's'} ` +
					`(${googleSummary.placesCreated} new, skipped ${googleSummary.skipped})`,
				googleSummary.errors.length > 0 ? 'error' : 'success'
			);
		} catch {
			// axios interceptor already surfaced a toast
		} finally {
			googleSubmitting = false;
		}
	}

	async function onCsvSubmit(event: Event) {
		event.preventDefault();
		if (!csvFile || csvSubmitting) return;
		csvSubmitting = true;
		try {
			csvSummary = await importPlacesCsv(csvFile);
			toast(
				`Created ${csvSummary.created} place${csvSummary.created === 1 ? '' : 's'} ` +
					`(skipped ${csvSummary.skipped})`,
				csvSummary.errors.length > 0 ? 'error' : 'success'
			);
		} catch {
			// axios interceptor already surfaced a toast
		} finally {
			csvSubmitting = false;
		}
	}
</script>

{#snippet uploadIcon()}<Upload class="h-4 w-4" />{/snippet}

<div class="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold text-fg md:text-[28px]">Import places</h1>
		<p class="mt-1 text-sm text-fg-muted">
			Import your saved places from a supported source.
		</p>
	</div>

	<!-- Tabs -->
	<div class="mb-5 flex gap-1 rounded-lg border border-border bg-bg-elevated p-1">
		<button
			type="button"
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
			'mapstr'
				? 'bg-accent text-white shadow-sm'
				: 'text-fg-muted hover:text-fg'}"
			onclick={() => (activeTab = 'mapstr')}
		>
			Mapstr
		</button>
		<button
			type="button"
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
			'google'
				? 'bg-accent text-white shadow-sm'
				: 'text-fg-muted hover:text-fg'}"
			onclick={() => (activeTab = 'google')}
		>
			Google Maps
		</button>
		{#if $isAdmin}
			<button
				type="button"
				class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab ===
				'csv'
					? 'bg-accent text-white shadow-sm'
					: 'text-fg-muted hover:text-fg'}"
				onclick={() => (activeTab = 'csv')}
			>
				Bulk places (admin)
			</button>
		{/if}
	</div>

	<!-- Mapstr tab -->
	{#if activeTab === 'mapstr'}
		<div class="mb-3">
			<p class="text-sm text-fg-muted">
				Mapstr emails you a zip archive with your export. Extract it and upload the
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">.geojson</code> file below.
				Already-saved places will be skipped.
			</p>
		</div>

		<form class="rounded-xl border border-border bg-bg-elevated p-5 shadow-sm" onsubmit={onMapstrSubmit}>
			<label
				class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg p-6 text-center transition-colors hover:border-accent"
			>
				<FileJson class="h-8 w-8 text-fg-muted" />
				<span class="text-sm font-medium text-fg">
					{mapstrFile ? mapstrFile.name : 'Choose a Mapstr GeoJSON file'}
				</span>
				<span class="text-xs text-fg-muted">
					{mapstrFile ? `${(mapstrFile.size / 1024).toFixed(1)} KB` : 'Click to browse'}
				</span>
				<input
					type="file"
					accept=".geojson,application/geo+json,application/json"
					class="hidden"
					onchange={onMapstrFileChange}
				/>
			</label>

			<div class="mt-5 flex items-center justify-end gap-2">
				<Button variant="ghost" tone="neutral" onclick={() => goto('/saved/list')}>Cancel</Button>
				<Button
					type="submit"
					variant="solid"
					tone="accent"
					disabled={!mapstrFile || mapstrSubmitting}
					loading={mapstrSubmitting}
					prefix={uploadIcon}
				>
					{mapstrSubmitting ? 'Importing…' : 'Import'}
				</Button>
			</div>
		</form>

		{#if mapstrSummary}
			<div class="mt-6 rounded-xl border border-border bg-bg-elevated p-5 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-fg">Import summary</h2>
				<dl class="grid grid-cols-3 gap-4 text-center">
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Imported</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{mapstrSummary.imported}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Skipped</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{mapstrSummary.skipped}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Failed</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{mapstrSummary.failed}</dd>
					</div>
				</dl>

				{#if mapstrSummary.errors.length > 0}
					<div class="mt-4">
						<button
							type="button"
							class="text-sm text-accent hover:underline"
							onclick={() => (mapstrShowErrors = !mapstrShowErrors)}
						>
							{mapstrShowErrors ? 'Hide' : 'Show'}
							{mapstrSummary.errors.length} error{mapstrSummary.errors.length === 1 ? '' : 's'}
						</button>
						{#if mapstrShowErrors}
							<ul
								class="mt-2 max-h-48 overflow-y-auto rounded-md border border-border bg-bg p-3 text-xs"
							>
								{#each mapstrSummary.errors as err (err.index)}
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
	{/if}

	<!-- Google Maps tab -->
	{#if activeTab === 'google'}
		<div class="mb-3">
			<p class="text-sm text-fg-muted">
				Export your saved places from
				<a
					href="https://takeout.google.com"
					target="_blank"
					rel="noopener noreferrer"
					class="text-accent hover:underline">Google Takeout</a
				>. Select "Saved" in the product list, download the archive, and upload the
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">Saved places.json</code> file below.
			</p>
		</div>

		<form class="rounded-xl border border-border bg-bg-elevated p-5 shadow-sm" onsubmit={onGoogleSubmit}>
			<label
				class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg p-6 text-center transition-colors hover:border-accent"
			>
				<FileJson class="h-8 w-8 text-fg-muted" />
				<span class="text-sm font-medium text-fg">
					{googleFile ? googleFile.name : 'Choose a Google Takeout JSON file'}
				</span>
				<span class="text-xs text-fg-muted">
					{googleFile ? `${(googleFile.size / 1024).toFixed(1)} KB` : 'Click to browse'}
				</span>
				<input
					type="file"
					accept=".json,application/json"
					class="hidden"
					onchange={onGoogleFileChange}
				/>
			</label>

			<div class="mt-5 flex items-center justify-end gap-2">
				<Button variant="ghost" tone="neutral" onclick={() => goto('/saved/list')}>Cancel</Button>
				<Button
					type="submit"
					variant="solid"
					tone="accent"
					disabled={!googleFile || googleSubmitting}
					loading={googleSubmitting}
					prefix={uploadIcon}
				>
					{googleSubmitting ? 'Importing…' : 'Import'}
				</Button>
			</div>
		</form>

		{#if googleSummary}
			<div class="mt-6 rounded-xl border border-border bg-bg-elevated p-5 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-fg">Import summary</h2>
				<dl class="grid grid-cols-3 gap-4 text-center">
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Saved</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{googleSummary.savedCreated}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">New places</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{googleSummary.placesCreated}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Skipped</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{googleSummary.skipped}</dd>
					</div>
				</dl>

				{#if googleSummary.errors.length > 0}
					<div class="mt-4">
						<button
							type="button"
							class="text-sm text-accent hover:underline"
							onclick={() => (googleShowErrors = !googleShowErrors)}
						>
							{googleShowErrors ? 'Hide' : 'Show'}
							{googleSummary.errors.length} error{googleSummary.errors.length === 1 ? '' : 's'}
						</button>
						{#if googleShowErrors}
							<table
								class="mt-2 w-full overflow-hidden rounded-md border border-border bg-bg text-xs"
							>
								<thead>
									<tr class="border-b border-border bg-bg-muted">
										<th class="px-3 py-1.5 text-left font-medium text-fg-muted">Row</th>
										<th class="px-3 py-1.5 text-left font-medium text-fg-muted">Error</th>
									</tr>
								</thead>
								<tbody>
									{#each googleSummary.errors as err, i (i)}
										<tr class="border-b border-border last:border-0">
											<td class="px-3 py-1.5 font-mono text-fg-muted">{err.row}</td>
											<td class="px-3 py-1.5 text-fg-muted">{err.message}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				{/if}

				<div class="mt-5 flex gap-2">
					<Button variant="solid" tone="accent" href="/">View on map</Button>
					<Button variant="soft" tone="neutral" href="/saved/list">Open saved list</Button>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Bulk places (admin) tab -->
	{#if activeTab === 'csv' && $isAdmin}
		<div class="mb-3">
			<p class="text-sm text-fg-muted">
				Upload a CSV file to bulk-create canonical places. Required columns:
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">name</code>,
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">lat</code>,
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">lng</code>,
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">address</code>. Optional:
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">description</code>,
				<code class="rounded bg-bg-muted px-1 py-0.5 text-xs">image</code>. Max 10 MB.
			</p>
		</div>

		<form class="rounded-xl border border-border bg-bg-elevated p-5 shadow-sm" onsubmit={onCsvSubmit}>
			<label
				class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-bg p-6 text-center transition-colors hover:border-accent"
			>
				<FileText class="h-8 w-8 text-fg-muted" />
				<span class="text-sm font-medium text-fg">
					{csvFile ? csvFile.name : 'Choose a CSV file'}
				</span>
				<span class="text-xs text-fg-muted">
					{csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Click to browse'}
				</span>
				<input
					type="file"
					accept=".csv,text/csv"
					class="hidden"
					onchange={onCsvFileChange}
				/>
			</label>

			<div class="mt-5 flex items-center justify-end gap-2">
				<Button variant="ghost" tone="neutral" onclick={() => goto('/')}>Cancel</Button>
				<Button
					type="submit"
					variant="solid"
					tone="accent"
					disabled={!csvFile || csvSubmitting}
					loading={csvSubmitting}
					prefix={uploadIcon}
				>
					{csvSubmitting ? 'Importing…' : 'Import'}
				</Button>
			</div>
		</form>

		{#if csvSummary}
			<div class="mt-6 rounded-xl border border-border bg-bg-elevated p-5 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-fg">Import summary</h2>
				<dl class="grid grid-cols-2 gap-4 text-center">
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Created</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{csvSummary.created}</dd>
					</div>
					<div>
						<dt class="text-xs uppercase tracking-wide text-fg-muted">Skipped</dt>
						<dd class="mt-1 text-2xl font-semibold text-fg">{csvSummary.skipped}</dd>
					</div>
				</dl>

				{#if csvSummary.errors.length > 0}
					<div class="mt-4">
						<button
							type="button"
							class="text-sm text-accent hover:underline"
							onclick={() => (csvShowErrors = !csvShowErrors)}
						>
							{csvShowErrors ? 'Hide' : 'Show'}
							{csvSummary.errors.length} error{csvSummary.errors.length === 1 ? '' : 's'}
						</button>
						{#if csvShowErrors}
							<table
								class="mt-2 w-full overflow-hidden rounded-md border border-border bg-bg text-xs"
							>
								<thead>
									<tr class="border-b border-border bg-bg-muted">
										<th class="px-3 py-1.5 text-left font-medium text-fg-muted">Row</th>
										<th class="px-3 py-1.5 text-left font-medium text-fg-muted">Error</th>
									</tr>
								</thead>
								<tbody>
									{#each csvSummary.errors as err, i (i)}
										<tr class="border-b border-border last:border-0">
											<td class="px-3 py-1.5 font-mono text-fg-muted">{err.row}</td>
											<td class="px-3 py-1.5 text-fg-muted">{err.message}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
