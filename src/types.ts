export interface DownloadOptions {
  url: string;
  output?: string;
  threads?: number;
  resume?: boolean;
  speedLimit?: number;
  headers?: Record<string, string>;
  proxy?: string;
  cookies?: string;
  filename?: string;
}

export interface DownloadTask {
  id: string;
  url: string;
  output: string;
  threads: number;
  resume: boolean;
  speedLimit: number;
  headers: Record<string, string>;
  proxy?: string;
  status: DownloadStatus;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  startTime: number;
  endTime?: number;
  error?: string;
  filename?: string;
  category?: string;
  retries?: number;
  checksum?: ChecksumInfo;
}

export enum DownloadStatus {
  Pending = 'pending',
  Queued = 'queued',
  Downloading = 'downloading',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Scheduled = 'scheduled',
}

export interface ChunkInfo {
  start: number;
  end: number;
  downloaded: number;
  file: string;
}

export interface DownloadState {
  url: string;
  output: string;
  totalSize: number;
  chunks: ChunkInfo[];
  startTime: number;
  headers: Record<string, string>;
  proxy?: string;
}

export interface Config {
  defaultThreads: number;
  defaultOutput: string;
  defaultSpeedLimit: number;
  maxRetries: number;
  retryDelay: number;
  chunkSize: number;
  tempDir: string;
  proxy?: string;
  concurrentDownloads: number;
  notifications: boolean;
  historyEnabled: boolean;
  maxHistoryItems: number;
  autoCleanup: boolean;
  cleanupDays: number;
  defaultCategory?: string;
  startMinimized: boolean;
  clipboardMonitor: boolean;
}

export interface VideoQuality {
  formatId: string;
  ext: string;
  resolution: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  filesizeApprox?: number;
  vbr?: number;
  abr?: number;
  note?: string;
}

export interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  description: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount: number;
  qualities: VideoQuality[];
  audioQualities: VideoQuality[];
  subtitles?: SubtitleInfo[];
  isPlaylist?: boolean;
  playlistCount?: number;
  playlistIndex?: number;
}

export interface SubtitleInfo {
  lang: string;
  langCode: string;
  url?: string;
  ext: string;
}

export interface BatchItem {
  url: string;
  output?: string;
}

export interface QueueItem {
  id: string;
  url: string;
  output: string;
  status: DownloadStatus;
  progress: number;
  speed: number;
  totalSize: number;
  downloadedSize: number;
  error?: string;
}

export type VideoSite = 'youtube' | 'twitch' | 'vimeo' | 'twitter' | 'tiktok' | 'instagram' | 'facebook' | 'other';

export const VIDEO_SITES: Record<VideoSite, RegExp> = {
  youtube: /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/,
  twitch: /(?:twitch\.tv|clips\.twitch\.tv)/,
  vimeo: /vimeo\.com/,
  twitter: /(?:twitter\.com|x\.com)/,
  tiktok: /tiktok\.com/,
  instagram: /instagram\.com/,
  facebook: /facebook\.com|fb\.watch/,
  other: /.*/,
};

export interface PlaylistInfo {
  title: string;
  id: string;
  url: string;
  channel: string;
  channelUrl?: string;
  thumbnail?: string;
  count: number;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  index: number;
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail?: string;
}

export interface PlaylistOptions {
  start?: number;
  end?: number;
  reverse?: boolean;
  shuffle?: boolean;
  format?: 'video' | 'audio' | 'best';
  quality?: string;
  concurrent?: number;
}

export interface ScheduledDownload {
  id: string;
  url: string;
  output: string;
  scheduledTime: Date;
  format?: string;
  quality?: string;
  category?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ScheduleRule {
  id: string;
  name: string;
  days: number[];
  startTime: string;
  endTime: string;
  speedLimit: number;
  enabled: boolean;
}

export interface HistoryEntry {
  id: string;
  url: string;
  filename: string;
  output: string;
  size: number;
  duration?: number;
  status: DownloadStatus;
  category?: string;
  site?: VideoSite;
  startTime: Date;
  endTime?: Date;
  error?: string;
  checksum?: ChecksumInfo;
}

export interface ChecksumInfo {
  type: 'md5' | 'sha256' | 'sha1';
  expected?: string;
  actual?: string;
  verified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  patterns: string[];
  outputTemplate: string;
  autoAssign: boolean;
}

export interface DownloadList {
  name: string;
  createdAt: Date;
  items: DownloadListItem[];
}

export interface DownloadListItem {
  url: string;
  output?: string;
  format?: string;
  quality?: string;
}

export interface StatsData {
  totalDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  totalBytes: number;
  totalDuration: number;
  averageSpeed: number;
  byCategory: Record<string, number>;
  bySite: Record<string, number>;
}

export interface ImportExportFormat {
  version: string;
  type: 'download-list' | 'history' | 'config';
  data: DownloadList | HistoryEntry[] | Config;
  exportedAt: Date;
}

export interface ClipboardRule {
  enabled: boolean;
  patterns: string[];
  autoDownload: boolean;
  output?: string;
  format?: string;
}
