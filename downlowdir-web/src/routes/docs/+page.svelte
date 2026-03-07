<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';

	let activeTab = $state('basic');

	const tabs = [
		{ id: 'basic', label: 'BASIC' },
		{ id: 'video', label: 'VIDEO' },
		{ id: 'playlist', label: 'PLAYLIST' },
		{ id: 'management', label: 'MANAGEMENT' },
	];

	const commands = {
		basic: [
			{ command: 'dld <url>', description: 'Download a file' },
			{ command: 'dld <url> -o /path', description: 'Download to specific directory' },
			{ command: 'dld <url> -t 16', description: 'Use 16 threads (default: 8)' },
			{ command: 'dld <url> -l 500', description: 'Limit speed to 500KB/s' },
			{ command: 'dld <url> -y', description: 'Skip confirmation prompts' },
			{ command: 'dld <url> -p http://proxy:8080', description: 'Use proxy' },
			{ command: 'dld <url> -H "User-Agent: custom"', description: 'Add custom headers' },
		],
		video: [
			{ command: 'dld <url> -f video', description: 'Ask for quality selection' },
			{ command: 'dld <url> -f audio', description: 'Audio only (MP3)' },
			{ command: 'dld <url> -f best', description: 'Best available quality' },
			{ command: 'dld <url> -s en', description: 'Download English subtitles' },
			{ command: 'dld <url> -c cookies.txt', description: 'Use cookies for authenticated downloads' },
		],
		playlist: [
			{ command: 'dld playlist <url>', description: 'Download entire playlist' },
			{ command: 'dld playlist <url> -f audio', description: 'Audio only' },
			{ command: 'dld playlist <url> --start 1 --end 10', description: 'Download first 10 videos' },
			{ command: 'dld playlist <url> --shuffle', description: 'Download in random order' },
			{ command: 'dld playlist <url> --reverse', description: 'Download in reverse order' },
		],
		management: [
			{ command: 'dld resume', description: 'Resume paused downloads' },
			{ command: 'dld resume <id>', description: 'Resume specific download by ID' },
			{ command: 'dld queue', description: 'Show download queue' },
			{ command: 'dld history', description: 'View download history' },
			{ command: 'dld stats', description: 'Show download statistics' },
			{ command: 'dld categories', description: 'Manage download categories' },
			{ command: 'dld config', description: 'Configure settings' },
			{ command: 'dld clear', description: 'Clear all paused downloads' },
			{ command: 'dld clear <id>', description: 'Clear specific paused download' },
			{ command: 'dld verify <file> <hash>', description: 'Verify file checksum' },
			{ command: 'dld schedule <url> -t "datetime"', description: 'Schedule a download' },
			{ command: 'dld batch <file>', description: 'Batch download from file' },
			{ command: 'dld ui', description: 'Launch interactive TUI' },
		],
	};
</script>

<svelte:head>
	<title>Commands - downlowdir</title>
	<meta name="description" content="Complete command reference for downlowdir CLI." />
</svelte:head>

<section class="py-16">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center mb-12">
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight mb-4 font-mono">
				<span class="text-primary">> </span>COMMANDS<span class="text-primary">_</span>
			</h1>
			<p class="text-sm text-muted-foreground font-mono">
				// complete command reference
			</p>
		</div>

		<div class="max-w-3xl mx-auto">
			<div class="flex gap-2 mb-6 overflow-x-auto pb-2 font-mono text-xs">
				{#each tabs as tab}
					<Button
						variant={activeTab === tab.id ? 'default' : 'outline'}
						size="sm"
						onclick={() => activeTab = tab.id}
					>
						[{tab.label}]
					</Button>
				{/each}
			</div>

			<div class="space-y-1">
				{#each commands[activeTab as keyof typeof commands] as cmd}
					<div class="flex items-start gap-4 p-3 rounded-sm bg-card border border-border hover:border-primary/40 transition-colors font-mono">
						<code class="text-primary whitespace-nowrap min-w-[260px] text-xs">{cmd.command}</code>
						<span class="text-muted-foreground text-xs">{cmd.description}</span>
					</div>
				{/each}
			</div>
		</div>

		<Card class="mt-8 max-w-3xl mx-auto">
			<CardHeader>
				<CardTitle>// INTERACTIVE MODE</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="bg-black border border-border rounded-sm p-3 font-mono text-xs mb-3">
					<span class="text-primary">$</span> dld
				</div>
				<p class="text-muted-foreground text-xs font-mono leading-relaxed">
					Running <code class="text-primary">dld</code> without arguments opens an interactive menu 
					where you can choose from: Download, Playlist, Batch, Schedule, History, Categories, Resume, Queue, Config, Stats, or Exit.
				</p>
			</CardContent>
		</Card>
	</div>
</section>
