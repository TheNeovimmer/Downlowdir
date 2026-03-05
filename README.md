# downlowdir

A powerful **CLI download manager** that gives you full control over your downloads. Think of it as a modern replacement for IDM, but built for the terminal.

---

## Why I Built This

I got tired of browser downloads failing at 95% on large files. Lost progress, starting over, the frustration. So I built `downlowdir` — a tool that splits files into chunks, downloads them in parallel, and **resumes from where it stopped** when things go wrong.

It also handles video sites. YouTube, Twitch, Vimeo, Twitter — you name it. Uses `yt-dlp` under the hood to grab videos in whatever quality you prefer.

---

## Installation

### 1. Install the CLI

```bash
npm install -g downlowdir
```

### 2. Install yt-dlp (optional, for video downloads)

```bash
# Linux/macOS - curl method
sudo curl -L https://yt-dl.org/downloads/latest/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Or with pip
pip install yt-dlp
```

Make sure `yt-dlp` is in your PATH. The CLI will find it automatically.

---

## Quick Start

```bash
# Download a file with 16 threads
dld https://example.com/large-file.zip -t 16

# Download YouTube video in best quality
dld https://youtube.com/watch?v=xxxxx -f best

# Download only the audio (MP3)
dld https://youtube.com/watch?v=xxxxx -f audio

# Download an entire playlist
dld playlist https://youtube.com/playlist?list=xxxxx

# Schedule a download for later
dld schedule https://example.com/file.zip -t "2024-12-25 09:00"

# View your download history
dld history
```

---

## How It Works

**The chunking system** is the magic. When you start a download, it asks the server how big the file is, then splits it into parts — typically 8 parts by default (you can crank this up to 32+).

Each chunk downloads independently in parallel. They all write to temporary files. When every chunk finishes, they merge into the final file. If something fails mid-download, those temporary files stay there. When you resume, it only downloads what hasn't finished yet.

For videos, it delegates to `yt-dlp` which handles all the complexity of extracting streams, muxing audio and video, and picking the right quality.

---

## Interactive TUI Mode

Launch the interactive terminal UI for a visual download manager experience:

```bash
dld ui
# or
dld interactive
# or simply
dld
```

**TUI Features:**
- Visual download progress with progress bars
- Download queue management
- Category-based organization
- Keyboard navigation
- Real-time statistics

---

## Commands Reference

### Basic Downloads

```bash
dld <url>              # Download anything
dld <url> -o /path     # Specify output directory
dld <url> -t 16        # Use 16 threads (default: 8)
dld <url> -l 500       # Limit speed to 500KB/s
dld <url> -y           # Skip confirmation prompts
dld <url> -p http://proxy:8080  # Use proxy
dld <url> -H "User-Agent: custom"  # Add custom headers
```

### Video Downloads

```bash
dld <url> -f video     # Ask for quality selection
dld <url> -f audio     # Audio only (MP3)
dld <url> -f best      # Best available quality
dld <url> -s en        # Download English subtitles
dld <url> -c cookies.txt  # Use cookies for authenticated downloads
```

### Playlist Downloads

```bash
dld playlist <url>              # Download entire playlist
dld playlist <url> -f audio     # Audio only
dld playlist <url> --start 1 --end 10   # First 10 videos only
dld playlist <url> --shuffle    # Download in random order
dld playlist <url> --reverse    # Download in reverse
```

### Management Commands

```bash
dld resume              # Resume paused downloads
dld resume <id>        # Resume specific download by ID
dld queue              # Show download queue
dld history            # View download history
dld stats              # Show download statistics
dld categories         # Manage download categories
dld config             # Configure settings
dld clear              # Clear all paused downloads
dld clear <id>         # Clear specific paused download
dld verify <file> <hash>  # Verify file checksum
dld schedule           # Schedule a download (interactive)
dld schedule <url> -t "2024-12-25 09:00"  # Schedule from CLI
dld batch <file>       # Batch download from file
dld ui                 # Launch interactive TUI
```

---

## Tips & Tricks

### Batch Downloading

Create a file with URLs (one per line, lines starting with `#` are ignored):

```bash
# urls.txt
https://example.com/file1.zip
https://example.com/file2.zip
https://youtube.com/watch?v=video1

# Download all
dld batch urls.txt -o ~/Downloads
```

### Resume Failed Downloads

If your download was interrupted, just run:

```bash
dld resume
```

Select the download you want to resume. It will pick up exactly where it left off.

### Speed Limiting

Prevent `dld` from hogging your bandwidth:

```bash
dld https://example.com/large-file.zip -l 500  # 500 KB/s limit
```

### Categories

Organize downloads by automatically categorizing based on URL patterns:

```bash
dld categories
```

Add categories with custom URL patterns — downloads matching those patterns will be automatically assigned.

### Verify Downloads

Check file integrity after download:

```bash
dld verify /path/to/file.iso abc123...
```

---

## Troubleshooting

### "command not found: dld"

Make sure the npm global bin directory is in your PATH:

```bash
# Add to your ~/.bashrc or ~/.zshrc
export PATH="$PATH:$(npm root -g)"
```

Then restart your terminal or run `source ~/.bashrc`.

### yt-dlp not found

Install yt-dlp:

```bash
pip install yt-dlp
# or
sudo curl -L https://yt-dl.org/downloads/latest/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### Downloads fail with "416 Range Not Satisfiable"

The server doesn't support chunked downloads. This is rare but can happen with some CDNs. You can try reducing threads:

```bash
dld <url> -t 1
```

### Permission denied errors

Make sure your output directory is writable:

```bash
dld <url> -o ~/Downloads  # Use a directory you have write access to
```

### Videos require authentication

For private videos or age-restricted content, export your browser cookies and use them:

```bash
# Export cookies from browser extension (e.g., "Get cookies.txt LOCALLY")
dld <url> -c cookies.txt
```

---

## Configuration

The config file lives at `~/.downlowdir/config.json`. Here's what you can customize:

```json
{
  "defaultThreads": 8,
  "defaultOutput": "~/Downloads",
  "defaultSpeedLimit": 0,
  "maxRetries": 3,
  "retryDelay": 1000,
  "concurrentDownloads": 3,
  "notifications": true,
  "historyEnabled": true,
  "maxHistoryItems": 1000,
  "tempDir": "~/.downlowdir/temp"
}
```

Edit directly or run:

```bash
dld config
```

---

## Requirements

- **Node.js** 18 or higher
- **yt-dlp** (optional, for video downloads)
- Unix-like shell (Linux, macOS, or Windows with WSL)

---

## The Bottom Line

This is a tool for people who want reliability. It doesn't try to be pretty or flashy. It just works. You give it a URL, it gives you a file. If something goes wrong, you try again and it picks up where it stopped.

That's it. That's the whole tool.

---

## Author

Made by [TheNeovimmer](https://github.com/TheNeovimmer)

Found a bug or have a suggestion? Open an issue on GitHub. Contributions are welcome.
