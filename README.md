# Downlowdir

<div align="center">

```text
   ▶ dld --info
   ──────────────────────────────────────────
   The high-performance CLI download engine.
   Status: [STABLE] | Optimized: Node.js 18+
```

_Architected for speed. Engineered for reliability. The developer's choice._

[![npm version](https://img.shields.io/npm/v/downlowdir.svg)](https://www.npmjs.com/package/downlowdir)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org)

</div>

---

## ⚡ why?

Modern browsers and generic fetch tools often struggle with high-bandwidth utilization and stateful recovery for multi-gigabyte files. **Downlowdir** provides a robust, developer-first solution: an industrial-grade engine featuring multi-threaded chunking and native media extraction, optimized for terminal-centric workflows.

---

## 🚀 quick start

Deploy locally in seconds:

```bash
npm install -g downlowdir
# Launch the interactive manager
dld
```

---

## 🛠️ core engine architecture

`Downlowdir` is built on a state-aware coordination layer that manages the lifecycle of shared system resources and network throughput.

### 1. multi-threaded chunking

When a URL is ingested, the engine calculates the file's `Content-Length` and partitions it into `N` concurrent segments (where `N` is your thread count). Each segment initiates an independent HTTP/TCP connection using `Range` headers to maximize bandwidth utilization.

### 2. state management & durability

Every download transition is tracked in a local state machine (backed by MD5-hashed JSON pointers).

- **Auto-Resume**: If a process is killed or network drops, `Downlowdir` reads the last byte position for each chunk and resumes exactly where it left off.
- **Atomic Merging**: Only after all segments pass integrity checks are they concatenated into the final binary.

### 3. streaming extraction

For media sites, the engine bootstraps a managed `yt-dlp` environment, handling quality negotiation and metadata extraction before handing off the stream to the internal downloader.

---

## 📊 how it works

> [!NOTE]
> For the curious: `Downlowdir` acts as a coordination layer. For regular files, it manages chunking and parallel HTTP connections. For media sites, it interfaces with a managed `yt-dlp` binary to handle extraction and merging.

```mermaid
graph TD
    classDef pro fill:#1a1b26,stroke:#7aa2f7,stroke-width:2px,color:#c0caf5;
    classDef start fill:#7aa2f7,stroke:#1a1b26,color:#1a1b26;

    A[URL Input]:::start --> B{Detect Type}:::pro
    B -- Regular File --> C[Multi-threaded Chunking]:::pro
    B -- Media Site --> D[yt-dlp Handler]:::pro
    C --> E[Concurrent Downloads]:::pro
    D --> E
    E --> F[Checksum/Merge]:::pro
    F --> G[Final File]:::start
```

---

## ⚙️ advanced usage patterns

### performance tuning

| Scenario              | Strategy              | Recommendation                |
| :-------------------- | :-------------------- | :---------------------------- |
| **High Latency**      | Increase thread count | `-t 16` or `-t 32`            |
| **Bandwidth Capping** | Limit ingress speed   | `-l 500` (KB/s)               |
| **Shared Network**    | Lower concurrency     | `-c 2` (Concurrent downloads) |

> [!TIP]
> Increasing threads beyond 32 often yields diminishing returns due to TCP congestion control and system I/O overhead. Start with `16` and scale based on your specific network pipe.

### developer & server-side flows

```bash
# Authenticated S3/Private API pulls
dld https://api.service.com/data -H "Authorization: Bearer $(cmd_to_get_token)"

# Headless server downloads (Zero-prompt)
dld <url> -y -o /var/www/assets/

# Piping through SOCKS5 for scraping/privacy
dld <url> -p socks5://username:password@proxy.internal:1080
```

---

## 📖 technical reference (CLI)

### parameters

- `-o, --output <path>`: Target destination. If a directory is provided, filename is inferred.
- `-t, --threads <n>`: Parallel segments. Default: `8`. Max limited only by system file descriptors.
- `-f, --format <type>`: Media extraction mode: `video`, `audio`, or `best`.
- `-q, --quality <id>`: Specific format override for advanced media extraction.
- `-l, --limit <kbps>`: Throttling bandwidth per download task.
- `-p, --proxy <url>`: Proxied connection string (supports HTTP/HTTPS/SOCKS5).
- `-H, --header <h>`: Custom HTTP headers (repeatable for multiple headers).
- `-c, --cookies <file>`: Netscape-compliant cookie file for authenticated sessions.
- `-y, --yes`: Automated mode. Bypasses all confirmation prompts.

### sub-commands

- `batch <file>`: Mass ingest URLs from a text/manifest file.
- `resume [id]`: Restart a specific partial download by its UID.
- `queue`: Real-time status of current and pending tasks.
- `config`: Global preference management (Default threads, paths, etc.).
- `clear [id]`: Purge temporary state and partial chunks.

---

## 🛡️ security & privacy

- **Local First**: All metadata, state files, and binaries reside in `~/.downlowdir/`.
- **No Telemetry**: We do not track what you download. No external pings are made unless required by the target URL.
- **State Integrity**: Temporary chunks are hashed and managed in a dedicated `temp/` sub-directory to prevent filename collisions.

---

## 🤝 contributing

We welcome PRs from senior engineers looking to optimize our threading model or extend site support.

1. Fork and branch from `main`.
2. Ensure `npm run lint` and `npm test` pass.
3. Keep logic atomic; document any changes to the chunking algorithm.

---

<div align="center">

_Engineered by [@TheNeovimmer](https://github.com/TheNeovimmer) for the terminal faithful._

</div>
