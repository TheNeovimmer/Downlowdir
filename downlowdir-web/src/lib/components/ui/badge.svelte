<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error";
	}

	let {
		class: className,
		variant = "default",
		children,
		...restProps
	}: Props = $props();

	const variants = {
		default: "bg-primary/10 text-primary border-primary/30",
		secondary: "bg-transparent text-muted-foreground border-border",
		outline: "bg-transparent border-primary text-primary",
		success: "bg-transparent text-primary border-primary/50",
		warning: "bg-transparent text-primary border-primary/50",
		error: "bg-transparent text-primary border-primary/50",
	};
</script>

<span
	class={cn(
		"inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-mono transition-colors",
		variants[variant],
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
