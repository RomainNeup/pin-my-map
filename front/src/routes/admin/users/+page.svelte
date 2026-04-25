<script lang="ts">
	import { deleteUser, listUsers, updateUserRole, type AdminUser } from '$lib/api/user';
	import Button from '$lib/components/Button.svelte';
	import { currentUser, type UserRole } from '$lib/stores/user';
	import { toast } from '$lib/stores/toast';
	import { confirm } from '$lib/stores/confirm';
	import { onMount } from 'svelte';

	let users = $state<AdminUser[]>([]);
	let loading = $state(false);
	let busyId = $state<string | null>(null);

	const load = async () => {
		loading = true;
		try {
			users = await listUsers();
		} finally {
			loading = false;
		}
	};

	onMount(load);

	const changeRole = async (id: string, role: UserRole) => {
		busyId = id;
		try {
			const updated = await updateUserRole(id, role);
			users = users.map((u) => (u.id === id ? updated : u));
			toast(`Role updated to ${role}`, 'success');
		} finally {
			busyId = null;
		}
	};

	const remove = async (user: AdminUser) => {
		const ok = await confirm({
			title: 'Delete user?',
			message: `Delete ${user.name} (${user.email})? This cannot be undone.`,
			confirmLabel: 'Delete',
			tone: 'danger'
		});
		if (!ok) return;
		busyId = user.id;
		try {
			await deleteUser(user.id);
			users = users.filter((u) => u.id !== user.id);
			toast('User deleted', 'info');
		} finally {
			busyId = null;
		}
	};
</script>

<div class="space-y-4">
	{#if loading}
		<p class="text-sm text-fg-muted">Loading…</p>
	{:else if users.length === 0}
		<p class="text-sm text-fg-muted">No users.</p>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<table class="w-full text-sm">
				<thead class="bg-bg-muted text-left text-xs uppercase text-fg-muted">
					<tr>
						<th class="px-3 py-2">Name</th>
						<th class="px-3 py-2">Email</th>
						<th class="px-3 py-2">Role</th>
						<th class="px-3 py-2 text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each users as u (u.id)}
						<tr class="border-t border-border">
							<td class="px-3 py-2 font-medium">{u.name}</td>
							<td class="px-3 py-2 text-fg-muted">{u.email}</td>
							<td class="px-3 py-2">
								<select
									class="rounded-md border border-border bg-bg-elevated px-2 py-1 text-sm"
									value={u.role}
									disabled={busyId === u.id}
									onchange={(e) =>
										changeRole(u.id, (e.currentTarget as HTMLSelectElement).value as UserRole)}
								>
									<option value="user">user</option>
									<option value="admin">admin</option>
								</select>
							</td>
							<td class="px-3 py-2 text-right">
								<Button
									variant="ghost"
									tone="danger"
									disabled={busyId === u.id || u.id === $currentUser?.id}
									onclick={() => remove(u)}
								>
									Delete
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
