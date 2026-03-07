<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLDivElement> {}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn("rounded-sm border border-border bg-card text-card-foreground", className)} {...restProps}>
	{@render children?.()}
</div>
