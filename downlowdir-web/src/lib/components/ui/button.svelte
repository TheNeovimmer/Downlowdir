<script lang="ts">
	import { cn } from "$lib/utils/cn";
	import type { HTMLButtonAttributes } from "svelte/elements";

	interface Props extends HTMLButtonAttributes {
		variant?: "default" | "secondary" | "outline" | "ghost" | "link";
		size?: "default" | "sm" | "lg" | "icon";
	}

	let {
		class: className,
		variant = "default",
		size = "default",
		children,
		...restProps
	}: Props = $props();

	const variants = {
		default: "bg-primary text-black hover:bg-primary-dim",
		secondary: "bg-muted text-primary border border-border hover:border-primary",
		outline: "bg-transparent border border-primary text-primary hover:bg-primary hover:text-black",
		ghost: "bg-transparent text-primary hover:bg-primary/10",
		link: "text-primary underline-offset-4 hover:underline",
	};

	const sizes = {
		default: "h-10 px-5 py-2 text-sm",
		sm: "h-8 px-4 text-xs",
		lg: "h-12 px-8 text-base",
		icon: "h-10 w-10",
	};
</script>

<button
	class={cn(
		"inline-flex items-center justify-center whitespace-nowrap font-mono transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 rounded-sm",
		variants[variant],
		sizes[size],
		className
	)}
	{...restProps}
>
	{@render children?.()}
</button>
