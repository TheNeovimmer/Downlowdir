# Downlowdir

A high-performance CLI download manager that gives you full control over your downloads. Think of it as a modern replacement for IDM, but for the terminal.

---

## What is this?

I built downlowdir because I needed something that could handle large files reliably. Browser downloads always seemed to fail at the worst moments, and I wanted something that could resume from where it left off without losing progress.

This tool does exactly that. It splits your downloads into multiple chunks and downloads them in parallel. If something goes wrong, you can pick up right where you stopped. No more starting over from zero.

It also handles video sites. YouTube, Twitch, Vimeo, Twitter - you name it. It uses yt-dlp under the hood to grab videos in whatever quality you prefer.

---

## Installation

```bash
npm install -g downlowdir
```

That's it. You might need to install yt-dlp separately if you plan on downloading videos:

```bash
# On Linux/macOS
sudo curl -L https://yt-dl.org/downloads/latest/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Or with pip
pip install yt-dlp
```

Make sure yt-dlp is in your PATH. Downlowdir will look for it automatically.

---

## Quick Examples

Download a file with 16 threads:
```bash
dld https://example.com/large-file.zip -t 16
```

Download a YouTube video in best quality:
```bash
dld https://youtube.com/watch?v=xxxxx -f best
```

Download only the audio:
```bash
dld https://youtube.com/watch?v=xxxxx -f audio
```

Download an entire playlist:
```bash
dld playlist https://youtube.com/playlist?list=xxxxx
```

Schedule a download for later:
```bash
dld schedule https://example.com/file.zip -t "2024-12-25 09:00"
```

Check your download history:
```bash
dld history
```

---

## The Problem It Solves

Let me paint a picture. You're downloading a 10GB file. It's at 95%. Your wifi hiccups. The connection drops. Your browser says "download failed" and offers you nothing but a restart button.

This tool doesn't work that way. It saves your progress constantly. When you resume, it continues from exactly where it left off. The chunks that already downloaded stay downloaded.

This is particularly useful for:
- Large ISO files
- Video collections
- Patch files for games
- Anything that takes more than a few minutes to download

---

## How It Works

The magic is in the chunking system. When you start a download, it asks the server how big the file is. Then it splits that file into parts - typically 8 parts by default, but you can crank that up to 32 or more.

Each chunk downloads independently. They all write to temporary files. When every chunk finishes, they merge into the final file. If something fails mid-download, those temporary files stay there. When you resume, it only downloads what hasn't finished yet.

For videos, it delegates to yt-dlp which handles all the complexity of extracting streams, muxing audio and video, and picking the right quality.

---

## Commands Reference

Here's what you can do:

### Basic Downloads
```bash
dld <url>              # Download anything
dld <url> -o /path     # Specify output directory
dld <url> -t 16       # Use 16 threads
dld <url> -l 500      # Limit speed to 500KB/s
dld <url> -y          # Skip "are you sure?" prompts
```

### Video Downloads
```bash
dld <url> -f video    # Ask for quality
dld <url> -f audio    # MP3 only
dld <url> -f best    # Best available
dld <url> -s en      # Download English subtitles
```

### Playlists
```bash
dld playlist <url>           # Download playlist
dld playlist <url> --start 1 --end 10  # First 10 only
dld playlist <url> --shuffle           # Random order
```

### Management
```bash
dld resume              # Resume paused downloads
dld queue              # See what's in queue
dld history           # View past downloads
dld stats             # Download statistics
dld categories        # Manage categories
dld clear             # Clear paused downloads
```

---

## Configuration

The config lives in `~/.downlowdir/config.json`. Here's what you can tweak:

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
  "maxHistoryItems": 1000
}
```

You can edit this directly or run `dld config` for an interactive setup.

---

## History and Statistics

Every download gets logged. You can see what you've downloaded, when, and how big the files were. This builds up over time so you always have a record of your downloads.

Run `dld stats` to see totals - how many completed, how many failed, total data downloaded. Useful if you're curious about your download habits.

---

## Why No GUI?

Because GUIs are slow. They introduce lag between what you want and what happens. Terminal tools work at the speed of thought.

Plus, you can script this. Pipe URLs into it. Schedule downloads. Chain commands. Do things that would require clicking around a hundred times in a GUI.

---

## Requirements

- Node.js 18 or higher
- yt-dlp (optional, for video downloads)
- Unix-like shell (works on Linux and macOS, Windows with WSL)

---

## The Bottom Line

This is a tool for people who want reliability. It doesn't try to be pretty or flashy. It just works. You give it a URL, it gives you a file. If something goes wrong, you try again and it picks up where it stopped.

That's it. That's the whole tool.

---

## Author

Made by [TheNeovimmer](https://github.com/TheNeovimmer)

If you find bugs or have suggestions, open an issue on GitHub. Contributions are welcome.
