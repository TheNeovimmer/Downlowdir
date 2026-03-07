<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLDivElement> {}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn("p-5 pt-0", className)} {...restProps}>
	{@render children?.()}
</div>
