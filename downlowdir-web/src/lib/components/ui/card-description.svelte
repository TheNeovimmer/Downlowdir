<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLParagraphElement> {}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<p class={cn("text-sm text-muted-foreground font-mono", className)} {...restProps}>
	{@render children?.()}
</p>
