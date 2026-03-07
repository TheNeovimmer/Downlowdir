<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';

	const features = [
		{
			title: 'MULTI-THREADED DOWNLOADS',
			description: 'Downlowdir splits files into chunks (default 8, up to 32+) and downloads them in parallel. Each chunk writes to temporary files, which are then merged into the final file.',
			command: '$ dld https://example.com/file.zip -t 16',
			tags: ['FAST', 'PARALLEL', 'EFFICIENT'],
		},
		{
			title: 'RESUME SUPPORT',
			description: 'Downloads interrupted by network issues or Ctrl+C can be resumed instantly. Downlowdir only downloads what has not been completed yet, saving you time and bandwidth.',
			command: '$ dld resume',
			tags: ['RELIABLE', 'PERSISTENT'],
		},
		{
			title: 'VIDEO DOWNLOADS',
			description: 'Download videos from YouTube, Twitch, Vimeo, Twitter and more. Choose quality, format, or download just the audio. Supports subtitles and cookies for authenticated content.',
			command: '$ dld https://youtube.com/watch?v=xxxx -f best',
			tags: ['YOUTUBE', 'TWITCH', 'VIMEO'],
		},
		{
			title: 'PLAYLIST DOWNLOADS',
			description: 'Download entire playlists with full control. Select start/end indices, shuffle or reverse the download order. Perfect for binge-watching offline.',
			command: '$ dld playlist https://youtube.com/playlist?list=xxxx --shuffle',
			tags: ['BATCH', 'ORGANIZED'],
		},
		{
			title: 'DOWNLOAD SCHEDULING',
			description: 'Schedule downloads for later. Set a specific date and time, or use quick presets like "in 1 hour" or "tomorrow". Perfect for off-peak downloads.',
			command: '$ dld schedule https://example.com/file.zip -t "2024-12-25 09:00"',
			tags: ['AUTOMATED', 'TIMING'],
		},
		{
			title: 'INTERACTIVE TUI',
			description: 'Launch the visual terminal UI for a complete download manager experience. View queue, manage categories, see real-time statistics - all with keyboard navigation.',
			command: '$ dld ui',
			tags: ['VISUAL', 'INTERACTIVE'],
		},
		{
			title: 'QUEUE MANAGEMENT',
			description: 'Manage multiple downloads simultaneously. Control concurrent downloads, view queue status, and organize your downloads with categories based on URL patterns.',
			command: '$ dld queue',
			tags: ['ORGANIZED', 'CONTROL'],
		},
		{
			title: 'BATCH DOWNLOADS',
			description: 'Download multiple files from a text file. One URL per line, lines starting with # are ignored. Perfect for bulk downloads.',
			command: '$ dld batch urls.txt -o ~/Downloads',
			tags: ['BULK', 'AUTOMATION'],
		},
		{
			title: 'CATEGORIES',
			description: 'Automatically organize downloads by categories. Define URL patterns that match specific categories - downloads are automatically sorted based on matching rules.',
			command: '$ dld categories',
			tags: ['ORGANIZATION', 'AUTO'],
		},
		{
			title: 'SPEED LIMITING',
			description: 'Control your bandwidth usage with speed limiting. Prevent downlowdir from hogging your connection while you work.',
			command: '$ dld https://example.com/file.zip -l 500',
			tags: ['BANDWIDTH', 'CONTROL'],
		},
		{
			title: 'CHECKSUM VERIFICATION',
			description: 'Verify downloaded files with MD5, SHA1, or SHA256 checksums. Ensure file integrity after download.',
			command: '$ dld verify /path/to/file.iso abc123...',
			tags: ['SECURITY', 'INTEGRITY'],
		},
		{
			title: 'PROXY & HEADERS',
			description: 'Use custom proxies and HTTP headers. Useful for corporate networks or servers that require specific headers.',
			command: '$ dld https://example.com/file.zip -p http://proxy:8080 -H "User-Agent: custom"',
			tags: ['ADVANCED', 'FLEXIBLE'],
		},
	];
</script>

<svelte:head>
	<title>Features - downlowdir</title>
	<meta name="description" content="Explore all features of downlowdir: multi-threaded downloads, video support, scheduling, and more." />
</svelte:head>

<section class="py-16">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center mb-12">
			<h1 class="text-2xl md:text-3xl font-bold tracking-tight mb-4 font-mono">
				<span class="text-primary">> </span>FEATURES<span class="text-primary">_</span>
			</h1>
			<p class="text-sm text-muted-foreground font-mono">
				// everything you need to manage downloads
			</p>
		</div>

		<div class="grid gap-4">
			{#each features as feature, i}
				<Card class="overflow-hidden border-border hover:border-primary/40 transition-colors">
					<div class="grid md:grid-cols-5 gap-0">
						<div class="md:col-span-2 p-4 border-b md:border-b-0 md:border-r border-border">
							<CardHeader class="p-0">
								<CardTitle>{feature.title}</CardTitle>
							</CardHeader>
							<CardContent class="p-0 pt-3">
								<CardDescription class="text-xs leading-relaxed">{feature.description}</CardDescription>
								<div class="flex flex-wrap gap-2 mt-3">
									{#each feature.tags as tag}
										<Badge variant="secondary">{tag}</Badge>
									{/each}
								</div>
							</CardContent>
						</div>
						<div class="md:col-span-3 p-4 bg-black/30">
							<div class="font-mono text-xs">
								<div class="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">// example</div>
								<div class="bg-black border border-primary/30 rounded-sm p-3">
									<code class="text-primary text-xs">{feature.command}</code>
								</div>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>
