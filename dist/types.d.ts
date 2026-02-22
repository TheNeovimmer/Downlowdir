export interface DownloadOptions {
    url: string;
    output?: string;
    threads?: number;
    resume?: boolean;
    speedLimit?: number;
    headers?: Record<string, string>;
    proxy?: string;
    cookies?: string;
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
}
export declare enum DownloadStatus {
    Pending = "pending",
    Queued = "queued",
    Downloading = "downloading",
    Paused = "paused",
    Completed = "completed",
    Failed = "failed",
    Cancelled = "cancelled"
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
    viewCount: number;
    qualities: VideoQuality[];
    audioQualities: VideoQuality[];
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
export declare const VIDEO_SITES: Record<VideoSite, RegExp>;
