<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLHeadingElement> {}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<h3 class={cn("font-mono font-bold text-primary text-sm uppercase tracking-wider", className)} {...restProps}>
	{@render children?.()}
</h3>
