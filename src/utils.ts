import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

export function sanitizeFilename(filename: string): string {
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/g;
  let sanitized = filename.replace(invalidChars, '_');
  sanitized = sanitized.replace(/\s+/g, ' ');
  sanitized = sanitized.trim();
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 200 - ext.length) + ext;
  }
  return sanitized;
}

export function generateId(url: string): string {
  return crypto.createHash('md5').update(url + Date.now()).digest('hex').substring(0, 8);
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return 'Unknown';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + '/s';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/^(\d{1,2}):?(\d{2})?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
  const parseT = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const t = parseT(time);
  const s = parseT(start);
  const e = parseT(end);
  if (s <= e) {
    return t >= s && t <= e;
  }
  return t >= s || t <= e;
}

export function matchUrlPattern(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(url)) return true;
    } catch {
      if (url.includes(pattern)) return true;
    }
  }
  return false;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    pdf: 'application/pdf',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function calculateChecksum(filePath: string, algorithm: 'md5' | 'sha256' | 'sha1' = 'sha256'): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export function getCategoryFromUrl(url: string, categories: { patterns: string[]; name: string }[]): string | undefined {
  for (const cat of categories) {
    if (matchUrlPattern(url, cat.patterns)) {
      return cat.name;
    }
  }
  return undefined;
}

export function isVideoUrl(url: string): boolean {
  const videoDomains = [
    'youtube.com', 'youtu.be', 'twitch.tv', 'vimeo.com',
    'twitter.com', 'x.com', 'tiktok.com', 'instagram.com',
    'facebook.com', 'fb.watch', 'reddit.com', 'soundcloud.com',
  ];
  try {
    const urlObj = new URL(url);
    return videoDomains.some(d => urlObj.hostname.includes(d));
  } catch {
    return false;
  }
}

export function getVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/)([0-9]+)/,
    /vimeo\.com\/([0-9]+)/,
    /(?:twitter\.com|x\.com)\/[\w]+\/status\/([0-9]+)/,
    /tiktok\.com\/@[\w]+\/video\/([0-9]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getPlaylistIdFromUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@[\w]+\/videos/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isPlaylistUrl(url: string): boolean {
  return getPlaylistIdFromUrl(url) !== null;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getAvailableSpace(dirPath: string): number {
  try {
    const stats = fs.statfsSync ? fs.statfsSync(dirPath) : null;
    if (stats) {
      return stats.bsize * stats.bfree;
    }
  } catch {}
  return 0;
}

export function ensureUniqueFilename(outputPath: string): string {
  if (!fs.existsSync(outputPath)) return outputPath;
  const dir = path.dirname(outputPath);
  const ext = path.extname(outputPath);
  const name = path.basename(outputPath, ext);
  let counter = 1;
  let newPath: string;
  do {
    newPath = path.join(dir, `${name} (${counter})${ext}`);
    counter++;
  } while (fs.existsSync(newPath));
  return newPath;
}

export function parseUserAgent(): string {
  const osName = os.platform();
  const osVersion = os.release();
  return `downlowdir/1.1.0 (${osName} ${osVersion})`;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
