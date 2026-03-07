<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/header.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<footer class="border-t border-primary/20 py-4">
		<div class="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
			<p class="text-xs text-muted-foreground font-mono">
				<span class="text-primary">//</span> Built by <a href="https://github.com/TheNeovimmer" class="text-primary hover:underline">TheNeovimmer</a>
			</p>
			<p class="text-xs text-muted-foreground font-mono">
				MIT License
			</p>
		</div>
	</footer>
</div>
