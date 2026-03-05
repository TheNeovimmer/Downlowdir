import { EventEmitter } from 'events';
import type { VideoInfo, PlaylistInfo, PlaylistOptions } from './types';
export interface YouTubeDownloadOptions {
    url: string;
    output?: string;
    format?: 'video' | 'audio' | 'best';
    quality?: string;
    formatId?: string;
    proxy?: string;
    cookies?: string;
}
export interface PlaylistDownloadOptions extends YouTubeDownloadOptions {
    playlist?: PlaylistOptions;
}
export declare class YouTubeDownloader extends EventEmitter {
    private ytDlpWrap;
    private progress;
    private speed;
    private downloaded;
    private total;
    private cancelled;
    private currentIndex;
    private totalVideos;
    constructor(proxy?: string);
    ensureYtDlp(): Promise<string>;
    getVideoInfo(url: string, proxy?: string): Promise<VideoInfo>;
    getPlaylistInfo(url: string, proxy?: string): Promise<PlaylistInfo>;
    private parseVideoInfo;
    download(options: YouTubeDownloadOptions): Promise<string>;
    downloadPlaylist(options: PlaylistDownloadOptions): Promise<{
        success: number;
        failed: number;
        outputPath: string;
    }>;
    downloadWithSubtitles(options: YouTubeDownloadOptions, subtitleLang?: string): Promise<string>;
    downloadMetadata(options: YouTubeDownloadOptions): Promise<string>;
    cancel(): void;
    getProgress(): {
        progress: number;
        speed: number;
        downloaded: number;
        total: number;
        videoIndex: number;
        totalVideos: number;
    };
    isPlaylistUrl(url: string): boolean;
}
