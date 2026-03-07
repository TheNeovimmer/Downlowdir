<script lang="ts">
	import { cn } from "$lib/utils/cn";

	interface Props {
		value: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { value, class: className, children }: Props = $props();
</script>

<div class={cn("relative", className)} data-slot="tabs" data-state="active" data-value={value}>
	{@render children?.()}
</div>
