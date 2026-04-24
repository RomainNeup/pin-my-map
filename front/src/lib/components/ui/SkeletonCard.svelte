<script lang="ts">
	import Skeleton from './Skeleton.svelte';
</script>

<div class="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated p-3">
	<Skeleton w="w-20" h="h-20" rounded="lg" />
	<div class="flex-1 space-y-2">
		<Skeleton w="w-3/4" h="h-4" />
		<Skeleton w="w-1/2" h="h-3" />
		<Skeleton w="w-2/3" h="h-3" />
	</div>
</div>
