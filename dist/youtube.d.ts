import { EventEmitter } from 'events';
import type { VideoInfo } from './types';
export interface YouTubeOptions {
    url: string;
    output?: string;
    format?: 'video' | 'audio' | 'best' | 'custom';
    quality?: string;
    formatId?: string;
    proxy?: string;
    cookies?: string;
}
export declare class YouTubeDownloader extends EventEmitter {
    private ytDlpWrap;
    private progress;
    private speed;
    private downloaded;
    private total;
    private cancelled;
    constructor(proxy?: string);
    ensureYtDlp(): Promise<string>;
    getVideoInfo(url: string, proxy?: string): Promise<VideoInfo>;
    download(options: YouTubeOptions): Promise<string>;
    cancel(): void;
    getProgress(): {
        progress: number;
        speed: number;
        downloaded: number;
        total: number;
    };
}
