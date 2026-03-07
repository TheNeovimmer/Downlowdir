<script lang="ts">
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/', label: 'HOME' },
		{ href: '/features', label: 'FEATURES' },
		{ href: '/install', label: 'INSTALL' },
		{ href: '/docs', label: 'DOCS' },
	];
</script>

<header class="sticky top-0 z-50 w-full border-b border-primary/30 bg-black/90 backdrop-blur">
	<div class="container mx-auto flex h-14 items-center justify-between px-4">
		<a href="/" class="flex items-center gap-3">
			<span class="text-primary font-mono text-lg">$</span>
			<span class="font-mono font-bold text-lg tracking-tight">downlowdir</span>
		</a>

		<nav class="hidden md:flex items-center gap-8">
			{#each navItems as item}
				<a
					href={item.href}
					class="font-mono text-xs tracking-widest transition-colors hover:text-primary {$page.url.pathname === item.href ? 'text-primary border-b border-primary' : 'text-muted-foreground'}"
				>
					[{item.label}]
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-4">
			<a
				href="https://github.com/TheNeovimmer/downlowdir"
				target="_blank"
				class="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
			>
				[GITHUB]
			</a>
			<a
				href="https://www.npmjs.com/package/downlowdir"
				target="_blank"
				class="font-mono text-xs text-primary hover:underline transition-colors"
			>
				[NPM]
			</a>
		</div>
	</div>
</header>
