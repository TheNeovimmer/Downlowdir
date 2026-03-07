<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';

	const steps = [
		{
			step: '01',
			title: 'INSTALL THE CLI',
			description: 'Install downlowdir globally using npm.',
			code: 'npm install -g downlowdir',
		},
		{
			step: '02',
			title: 'INSTALL YT-DLP (OPTIONAL)',
			description: 'For video downloads, install yt-dlp. It will be auto-detected.',
			code: 'pip install yt-dlp',
			optional: true,
		},
		{
			step: '03',
			title: 'QUICK START',
			description: 'Start downloading!',
			code: 'dld https://example.com/file.zip',
		},
	];

	const platforms = [
		{
			name: 'curl (Linux/macOS)',
			code: `sudo curl -L https://yt-dl.org/downloads/latest/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp`,
		},
		{
			name: 'pip',
			code: 'pip install yt-dlp',
		},
		{
			name: 'Homebrew',
			code: 'brew install yt-dlp',
		},
	];
</script>

<svelte:head>
	<title>Install - downlowdir</title>
	<meta name="description" content="Install downlowdir - the modern CLI download manager." />
</svelte:head>

<section class="py-16">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center mb-12">
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight mb-4 font-mono">
				<span class="text-primary">> </span>INSTALL<span class="text-primary">_</span>
			</h1>
			<p class="text-sm text-muted-foreground font-mono">
				// install downlowdir in seconds
			</p>
		</div>

		<div class="max-w-2xl mx-auto">
			{#each steps as s, i}
				<div class="flex gap-4 mb-6">
					<div class="flex-shrink-0 w-10 h-10 border border-primary/50 flex items-center justify-center">
						<span class="text-primary font-mono text-sm font-bold">{s.step}</span>
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h3 class="text-sm font-mono font-bold">{s.title}</h3>
							{#if s.optional}
								<Badge variant="outline">[OPTIONAL]</Badge>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground mb-3 font-mono">{s.description}</p>
						<div class="bg-black border border-border rounded-sm p-3 font-mono text-xs flex items-center gap-3">
							<code class="text-primary flex-1">$ {s.code}</code>
							<Button size="sm" variant="ghost" class="text-[10px] h-6 px-2" onclick={() => navigator.clipboard.writeText(s.code)}>
								[COPY]
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<Card class="mt-10 max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>// TROUBLESHOOTING</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div>
						<h4 class="font-mono text-sm font-bold mb-1 text-primary">"command not found: dld"</h4>
						<p class="text-xs text-muted-foreground mb-2 font-mono">Make sure npm global bin directory is in your PATH:</p>
						<div class="bg-black border border-border rounded-sm p-3 font-mono text-xs">
							export PATH="$PATH:$(npm root -g)"
						</div>
					</div>
					<div>
						<h4 class="font-mono text-sm font-bold mb-1 text-primary">yt-dlp not found</h4>
						<p class="text-xs text-muted-foreground mb-2 font-mono">Install yt-dlp using one of these methods:</p>
						<div class="space-y-2">
							{#each platforms as platform}
								<div>
									<p class="text-xs font-mono font-bold mb-1 text-muted-foreground">// {platform.name}</p>
									<div class="bg-black border border-border rounded-sm p-3 font-mono text-xs whitespace-pre">{platform.code}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card class="mt-6 max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>// REQUIREMENTS</CardTitle>
			</CardHeader>
			<CardContent>
				<ul class="space-y-2 text-muted-foreground font-mono text-xs">
					<li class="flex items-center gap-2">
						<span class="text-primary">></span>
						Node.js 18 or higher
					</li>
					<li class="flex items-center gap-2">
						<span class="text-primary">></span>
						yt-dlp (optional, for video downloads)
					</li>
					<li class="flex items-center gap-2">
						<span class="text-primary">></span>
						Unix-like shell (Linux, macOS, or Windows with WSL)
					</li>
				</ul>
			</CardContent>
		</Card>
	</div>
</section>
