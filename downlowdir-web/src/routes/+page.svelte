<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	const features = [
		{
			title: 'MULTI-THREADED',
			description: 'Split files into chunks and download in parallel for maximum speed.',
		},
		{
			title: 'RESUME SUPPORT',
			description: 'Interrupted downloads? Resume from where you left off.',
		},
		{
			title: 'VIDEO DOWNLOADS',
			description: 'YouTube, Twitch, Vimeo and more with quality selection.',
		},
		{
			title: 'PLAYLIST SUPPORT',
			description: 'Download entire playlists with shuffle and reverse options.',
		},
	];

	let terminalLines: string[] = $state([]);
	let showCursor = $state(true);

	const terminalCommands = [
		{ text: '$ dld https://example.com/large-file.zip -t 16', delay: 600 },
		{ text: '', delay: 200 },
		{ text: '  URL: https://example.com/large-file.zip', delay: 80 },
		{ text: '  Output: ~/Downloads/large-file.zip', delay: 50 },
		{ text: '  Threads: 16', delay: 50 },
		{ text: '', delay: 100 },
		{ text: '  [######################] 67% | 1.2 GB / 1.8 GB | 45 MB/s', delay: 400 },
		{ text: '', delay: 150 },
		{ text: '  > Download complete!', delay: 100 },
		{ text: '  > Saved: ~/Downloads/large-file.zip', delay: 50 },
	];

	onMount(() => {
		const interval = setInterval(() => {
			showCursor = !showCursor;
		}, 530);

		async function typeWriter() {
			for (const cmd of terminalCommands) {
				await new Promise(r => setTimeout(r, cmd.delay));
				if (cmd.text) {
					terminalLines = [...terminalLines, cmd.text];
				}
			}
		}

		typeWriter();

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>downlowdir - CLI Download Manager</title>
	<meta name="description" content="A powerful CLI download manager with multi-threading, resume support, and video site integration." />
</svelte:head>

<section class="relative overflow-hidden py-20 md:py-28">
	<div class="container mx-auto px-4 relative">
		<div class="max-w-4xl mx-auto text-center mb-16">
			<h1 class="text-3xl md:text-5xl font-bold tracking-tight mb-6 font-mono">
				<span class="text-primary">> </span>downlowdir<span class="text-primary">_</span>
			</h1>
			<p class="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-mono leading-relaxed">
				A powerful CLI tool that gives you full control over your downloads.
				Multi-threaded, resume support, and video site integration.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono">
				<Button size="lg" onclick={() => window.location.href = '/install'}>
					[ GET STARTED ]
				</Button>
				<Button variant="outline" size="lg" onclick={() => window.location.href = '/features'}>
					[ FEATURES ]
				</Button>
			</div>
		</div>

		<div class="max-w-3xl mx-auto mb-20">
			<div class="terminal-window">
				<div class="terminal-header">
					<span class="terminal-header-title">terminal</span>
				</div>
				<div class="p-5 font-mono text-sm min-h-[260px] scanline">
					{#each terminalLines as line}
						<div class="text-primary mb-0.5">{line}</div>
					{/each}
					{#if showCursor && terminalLines.length < terminalCommands.length}
						<span class="terminal-cursor"></span>
					{/if}
				</div>
			</div>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each features as feature}
				<Card class="bg-card border-border hover:border-primary/50 transition-colors">
					<CardHeader>
						<CardTitle>{feature.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>{feature.description}</CardDescription>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</section>

<section class="py-16 border-t border-primary/20">
	<div class="container mx-auto px-4">
		<div class="max-w-3xl mx-auto text-center">
			<h2 class="text-lg font-mono text-primary mb-4">// ready to try it out?</h2>
			<p class="text-muted-foreground mb-6 font-mono text-sm">
				Install downlowdir and take control of your downloads.
			</p>
			<div class="flex justify-center">
				<div class="bg-card border border-border rounded-sm p-4 font-mono text-sm">
					<span class="text-primary">$</span> npm install -g downlowdir
				</div>
			</div>
		</div>
	</div>
</section>
