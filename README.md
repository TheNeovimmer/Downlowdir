# downlowdir

<div align="center">

```
   ▶ downlowdir
   ─────────────────────────────────────────
   The IDM alternative for developers
```

*A CLI download manager that just works.*

[![npm version](https://img.shields.io/npm/v/downlowdir.svg)](https://www.npmjs.com/package/downlowdir)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org)

</div>

---

## what is this?

You know how frustrating it is when:
- Downloads fail halfway through
- You can't resume that 2GB file
- YouTube videos need some sketchy website
- Your browser's download manager is... basic
- You need specific video quality but can't find it
- Batch downloading is a nightmare

**downlowdir** fixes all of that. It's a full-featured command-line download manager built for developers who want speed, reliability, and zero nonsense.

---

## features

**Multi-threaded downloads**
Split files across 8+ threads. Download faster.

**Resume support**
Ctrl+C won't kill your progress. Resume anytime.

**Quality selection**
Pick video quality with file sizes shown. No guessing.

**100+ video sites**
YouTube, Twitch, Vimeo, Twitter, TikTok, Instagram, Facebook, and more.

**Batch downloads**
Download hundreds of files from a list. Concurrent support.

**Speed limiting**
Cap your bandwidth when needed.

**Proxy support**
HTTP, HTTPS, SOCKS5 - whatever you need.

**Custom headers**
API downloads, authentication, whatever you need.

**Cookie support**
Download age-restricted or private videos.

**Clean interface**
One command. No config files required.

---

## installation

```bash
npm install -g downlowdir
```

That's it. Now you have `dld` command.

---

## quick start

```bash
# Just run it - interactive mode
dld
```

That opens a clean menu. Pick what you want, paste a URL, done.

---

## usage

### download files

```bash
# Auto-detects and downloads with 8 threads
dld https://example.com/large-file.zip

# Specify output location
dld https://example.com/file.zip -o ~/Downloads

# Use 16 threads for faster downloads
dld https://example.com/file.zip -t 16

# Limit speed to 500 KB/s
dld https://example.com/file.zip -l 500

# Use proxy
dld https://example.com/file.zip -p socks5://127.0.0.1:1080

# Custom headers (for API downloads)
dld https://api.example.com/file -H "Authorization: Bearer token123"
```

### download from youtube

```bash
# Interactive - pick quality with file sizes shown
dld "https://youtube.com/watch?v=dQw4w9WgXcQ"

# Audio only - extracts to MP3
dld "https://youtube.com/watch?v=dQw4w9WgXcQ" -f audio

# Best quality (auto)
dld "https://youtube.com/watch?v=dQw4w9WgXcQ" -f best

# Specific quality by format ID
dld "https://youtube.com/watch?v=dQw4w9WgXcQ" -q 137+140

# Skip prompts
dld "https://youtube.com/watch?v=dQw4w9WgXcQ" -f audio -y

# Age-restricted videos (cookies from browser)
dld "https://youtube.com/watch?v=..." -c cookies.txt
```

### download from other sites

```bash
# Twitch clips/VODs
dld "https://twitch.tv/clip/..."

# Vimeo
dld "https://vimeo.com/..."

# Twitter/X videos
dld "https://twitter.com/user/status/..."
dld "https://x.com/user/status/..."

# TikTok
dld "https://tiktok.com/@user/video/..."

# Instagram reels/posts
dld "https://instagram.com/reel/..."

# Facebook videos
dld "https://facebook.com/watch/..."
```

### batch downloads

Create a file `urls.txt`:
```
# Comments start with #
https://youtube.com/watch?v=abc123
https://example.com/file1.zip
https://example.com/file2.zip
```

Then run:
```bash
# Download all with 3 concurrent
dld batch urls.txt -o ./downloads -c 3

# Or interactively
dld
# Select "Batch download from file"
```

### manage downloads

```bash
# View download queue
dld queue

# List paused downloads
dld resume

# Resume specific download
dld resume a1b2c3d4

# Clear all paused downloads
dld clear

# Clear specific one
dld clear a1b2c3d4
```

### configure defaults

```bash
dld config
```

Sets:
- Default threads
- Output directory
- Speed limit
- Proxy URL
- Concurrent downloads

---

## options

| Flag | Description |
|------|-------------|
| `-o, --output <path>` | Where to save files |
| `-t, --threads <n>` | Parallel connections (default: 8) |
| `-f, --format <type>` | Video: `video`, `audio`, `best` |
| `-q, --quality <id>` | Specific format ID (e.g., `137+140`) |
| `-l, --limit <kbps>` | Speed limit in KB/s |
| `-p, --proxy <url>` | Proxy URL (HTTP/SOCKS5) |
| `-H, --header <h>` | Custom header (can use multiple) |
| `-c, --cookies <file>` | Cookies file for video sites |
| `-y, --yes` | Skip all prompts |

---

## commands

| Command | What it does |
|---------|--------------|
| `dld [url]` | Download file or video |
| `dld batch <file>` | Batch download from file |
| `dld resume [id]` | Resume paused download |
| `dld queue` | Show download queue |
| `dld config` | Set default preferences |
| `dld clear [id]` | Remove paused downloads |

---

## quality selection

When downloading videos interactively, you'll see:

```
? Select video quality: (Use arrow keys)
❯ 1920x1080 60fps - mp4 (125.4 MB)
  1920x1080 30fps - mp4 (89.2 MB)
  1280x720 30fps - mp4 (45.1 MB)
  854x480 30fps - mp4 (22.3 MB)
  640x360 30fps - mp4 (12.1 MB)
  audio only - m4a (3.2 MB)
```

No more guessing file sizes!

---

## how it works

```
┌─────────────────────────────────────────────────────┐
│                    downlowdir                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Input URL                                         │
│      │                                              │
│      ▼                                              │
│   ┌─────────────┐                                   │
│   │   Detect    │── Video ──▶ yt-dlp handler       │
│   │   Type      │   Site                            │
│   └─────────────┘                                   │
│      │                                              │
│      ▼ Regular file                                 │
│   ┌─────────────┐                                   │
│   │   Split     │── Divide into chunks             │
│   │   Chunks    │                                   │
│   └─────────────┘                                   │
│      │                                              │
│      ▼                                              │
│   ┌─────────────┐                                   │
│   │  Multi-     │── 8 parallel connections         │
│   │  Thread     │                                   │
│   └─────────────┘                                   │
│      │                                              │
│      ▼                                              │
│   ┌─────────────┐                                   │
│   │   Merge     │── Combine to final file          │
│   └─────────────┘                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## why i built this

Honestly? I got tired of:

1. **Browser downloads** - One connection, no resume, basic UI
2. **IDM** - Windows only, expensive, bloated, no CLI
3. **wget/curl** - Great but no parallel downloads by default
4. **YouTube sites** - Every site has ads, limits, or breaks
5. **Quality selection** - No easy way to see file sizes before downloading
6. **Batch downloads** - No good CLI tool for downloading multiple files

I wanted something that:
- Works on any OS with Node.js
- Downloads anything (files, videos from 100+ sites)
- Resumes broken downloads
- Shows quality options with file sizes
- Downloads multiple files concurrently
- Supports proxies and custom headers
- Shows clean progress
- Doesn't need a GUI

So I built it.

---

## technical details

**Built with:**
- TypeScript
- Commander.js (CLI framework)
- Axios (HTTP client)
- yt-dlp (video backend - supports 100+ sites)
- cli-progress (progress bars)
- inquirer (interactive prompts)

**Where stuff lives:**
```
~/.downlowdir/
├── config.json     # Your settings
├── temp/           # Download chunks
└── bin/            # yt-dlp binary
```

**Download state files:**
- `.json` files track partial downloads
- Resume reads state and continues from byte position
- Clean up automatically on completion

---

## requirements

- Node.js 18 or higher
- npm

For video downloads, yt-dlp is auto-downloaded on first use (~10MB).

---

## troubleshooting

**"EISDIR error"** - Fixed in latest version. Update: `npm update -g downlowdir`

**"yt-dlp not found"** - Run once, it downloads automatically. Check `~/.downlowdir/bin/`

**"Slow downloads"** - Increase threads: `dld <url> -t 16`

**"Permission denied"** - On Unix, run: `chmod +x ~/.downlowdir/bin/yt-dlp`

**"Video unavailable"** - Try with cookies: `dld <url> -c cookies.txt`

**"Proxy not working"** - Make sure to include protocol: `http://`, `socks5://`

---

## examples

```bash
# Download YouTube playlist video in 1080p
dld "https://youtube.com/watch?v=..." -o ~/Videos

# Download Twitch VOD
dld "https://twitch.tv/videos/..." -f video

# Batch download with 5 concurrent
dld batch urls.txt -o ./downloads -c 5

# Download with proxy and speed limit
dld https://example.com/file.zip -p socks5://127.0.0.1:1080 -l 1000

# Download private file with auth header
dld https://api.example.com/file -H "Authorization: Bearer token"

# Download Instagram reel
dld "https://instagram.com/reel/..."

# Download Twitter video
dld "https://x.com/user/status/..."
```

---

## contributing

Found a bug? Have an idea?

1. Fork it
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## license

MIT - Use it however you want.

---

<div align="center">

```
Built with coffee and frustration by @TheNeovimmer
```

*If this helped you, consider giving it a ⭐*

</div>
